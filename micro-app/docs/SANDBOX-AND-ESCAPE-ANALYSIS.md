# Micro-App 与 Qiankun：沙箱性能与逃逸问题对比分析

本文从**沙箱实现思路**、**性能**和**逃逸处理**三方面对比 micro-app 与 qiankun，说明为何 micro-app 在沙箱性能与逃逸处理上往往更易控、更巧妙。

---

## 一、沙箱实现思路对比

### 1.1 Qiankun：fakeWindow + 只写副本

- **SnapshotSandbox**：遍历 `window` 做快照，卸载时按 diff 还原。兼容性好，但**性能差**（全量遍历 + 还原），且只适合单实例。
- **LegacySandbox**：单应用 Proxy，通过三个 Map 记录变更，**仍会写真实 window**，多实例会互相污染。
- **ProxySandbox**（多实例）：
  - 为每个子应用创建一个 **fakeWindow**：从真实 `window` 上拷贝可枚举/可配置属性到空对象，作为「副本」。
  - 用 **Proxy 代理 fakeWindow**：`get` 优先 fakeWindow，没有再 fallback 到真实 `window`（并对函数做 `bind(globalContext)`）；`set` **只写 fakeWindow**，不写真实 window。
  - 目的：多实例之间、子应用与主应用之间通过「不写真实 window」来隔离。

特点：隔离依赖「写操作不落真实 window」；读操作通过 fallback 到真实 window 共享全局能力，但需要处理 **bound 的 this** 和**不可配置属性**。

### 1.2 Micro-App：microAppWindow（空对象）+ Proxy + 明确逃逸

- **With 沙箱**：
  - 每个子应用一个 **microAppWindow**（继承自空的 `CustomWindow`），**不拷贝** window 属性。
  - 用 **Proxy 代理 microAppWindow**：`get` 优先 microAppWindow，再 `scopeProperties`，否则从 **rawWindow** 读（并对函数 `bind(rawWindow)`）；`set` 默认写 microAppWindow，只有少数 key（如 `location`）写 rawWindow，另有 **escapeProperties** 显式「允许逃逸」到 rawWindow。
  - 子应用代码通过 **with(proxyWindow.__MICRO_APP_WINDOW__)** + IIFE 包一层，使未声明变量从 proxy 上查找，从而命中沙箱。

- **iframe 沙箱**：
  - 子应用在**独立 iframe** 的 document 中执行，没有 with，也没有对主 window 的 Proxy；通过 **function(window, self, global, location).call(iframeWindow, ...)** 注入 iframe 的 window。
  - 天然隔离，无 Proxy 逃逸问题；Vite 等 module 子应用必须用 iframe 沙箱（with 无法处理 `import`）。

特点：**默认不污染真实 window**，只有显式列入 `escapeProperties` / `rawWindowScopeKeyList` 的才写 rawWindow；隔离边界清晰，逃逸可控。

---

## 二、逃逸问题处理方式对比

### 2.1 何为「逃逸」

- **沙箱逃逸**：子应用通过某种方式访问或修改到「真实 window / document」或其它子应用的环境，导致隔离失效。
- **合理逃逸**：某些全局单例（如 SystemJS 的 `System`、构建的 `__cjsWrapper`）必须挂在真实 window 上才能被多份脚本共享，需要「受控逃逸」。

### 2.2 Qiankun 的逃逸与边界问题

1. **不写 rawWindow**  
   set 只写 fakeWindow，因此「子应用写的变量」不会污染主应用，多实例间也不会互相写。这是其防止逃逸的主手段。

2. **读时的 fallback 与 bound**  
   get 时若 fakeWindow 没有，则从 rawWindow 取，并对函数做 `value.bind(globalContext)`。带来的问题：
   - **不可配置/只读属性**：若 rawWindow 上某属性不可配置，子应用无法在 fakeWindow 上「覆盖」，qiankun 需在初始化时拷贝并放宽 descriptor，否则易报错（有 PR 修只读属性）。
   - **同名变量与错误 bound**：压缩后子应用与主应用可能得到同名变量，get 可能从 fakeWindow 取到「错误引用」再 bound 到 globalContext，导致行为异常（如 [Issue #2456](https://github.com/umijs/qiankun/issues/2456)）。解决往往依赖构建侧（如 `esbuild minify iife`）避免变量泄漏到全局。

3. **多实例**  
   依赖「每个实例一个 fakeWindow + 只写 fakeWindow」，逻辑清晰，但 fakeWindow 的初始化（拷贝 window 属性）和 get 的 fallback/bound 增加了复杂度和逃逸面。

### 2.3 Micro-App 的逃逸设计（更巧妙之处）

1. **显式逃逸列表**  
   - **escapeProperties / staticEscapeProperties**：如 `System`、`__cjsWrapper`、`__REACT_ERROR_OVERLAY_GLOBAL_HOOK__` 等。  
   - 当子应用 **set** 这些 key 时，会**同时** `Reflect.set(rawWindow, key, value)`，并加入 `escapeKeys`；**卸载时**遍历 `escapeKeys` 执行 `Reflect.deleteProperty(rawWindow, key)`，恢复主应用环境。  
   - 即：逃逸是**设计内、可枚举、可回收**的，而不是「通过 get fallback 间接碰到 rawWindow」。

2. **作用域隔离（scopeProperties）**  
   - 如 `Vue`、`webpackJsonp`、`onpopstate`、`onhashchange`、`event` 等，只在 **microAppWindow** 上读写，不写 rawWindow，子应用间、子与主之间这些 key 互不污染。

3. **必须走 rawWindow 的 key（rawWindowScopeKeyList）**  
   - 如 `location`：读写直接落到 rawWindow（或 proxyLocation），因为 location 本质是单例，子应用共享主文档的 location；iframe 沙箱下则用 iframe 的 location，天然隔离。

4. **injectedKeys 与卸载**  
   - 子应用在 microAppWindow 上「注入」的新 key 会记入 `injectedKeys`，卸载时从 microAppWindow 上 delete；**escapeKeys** 从 rawWindow 上 delete。  
   - 这样既保证了「默认不污染」，又保证了「需要逃逸的少数 key 可登记、可清理」。

对比小结：qiankun 靠「不写 rawWindow」防污染，但读的 fallback 和 bound 带来不可配置属性、同名变量等边界问题；micro-app 用「空对象 + 按需读 rawWindow + 显式逃逸列表 + 卸载时清理」，逃逸路径明确，更容易控制和排查。

---

## 三、性能对比

| 维度           | Qiankun                          | Micro-App（with 沙箱）              | Micro-App（iframe 沙箱）   |
|----------------|-----------------------------------|-------------------------------------|----------------------------|
| 沙箱数据结构   | fakeWindow 需拷贝 window 部分属性 | microAppWindow 空对象，不拷贝        | 无主 window 代理           |
| get 开销       | 先 fakeWindow 再 rawWindow + bind | 先 microAppWindow 再 rawWindow+bind | 直接 iframe window         |
| set 开销       | 只写 fakeWindow                   | 多数写 microAppWindow，少数写 raw   | 只写 iframe window         |
| 特殊语法       | 无 with                           | 一层 with(proxyWindow.__MICRO_APP_WINDOW__) | 无 with                    |
| 快照/还原      | SnapshotSandbox 有整表遍历        | 无快照，仅清理 injectedKeys/escapeKeys | 无                         |
| document 代理  | 有                                | 有（createElement 等打 __MICRO_APP_NAME__） | 无（独立 document）        |

- **Qiankun**：ProxySandbox 无 with，但 fakeWindow 的初始化和 get 的 fallback/bound 有成本；SnapshotSandbox 性能最差。
- **Micro-App with**：多一层 with 的运行时开销，但代理的是空对象，属性数量小，get/set 的 trap 更轻；逃逸路径少，逻辑简单。
- **Micro-App iframe**：无 Proxy、无 with，性能最好，隔离也最彻底；代价是独立文档、需处理通信与路由（如本 demo 的 `microApp.start({ iframe: true })`）。

---

## 四、总结表

| 项目         | Qiankun（ProxySandbox）     | Micro-App（with）                    | Micro-App（iframe）     |
|--------------|-----------------------------|---------------------------------------|--------------------------|
| 隔离思路     | fakeWindow 副本，只写副本    | 空 microAppWindow + 按需读 rawWindow  | 独立 iframe 文档         |
| 逃逸控制     | 不写 rawWindow，读 fallback 易产生边界问题 | 显式 escapeProperties + 卸载清理      | 无沙箱逃逸               |
| 多实例       | 支持，每实例一 fakeWindow   | 支持，每实例一 microAppWindow        | 支持，每实例一 iframe    |
| 不可配置属性 | 需拷贝并放宽 descriptor     | 不依赖拷贝，按需从 raw 读             | 不涉及                   |
| 性能         | 无 with，有 bound/拷贝成本  | 有 with，代理空对象、逃逸少           | 无 Proxy/with，最佳      |
| 接入形态     | 主应用 registerMicroApps + 子应用导出生命周期 | 主应用 `<micro-app name url />`，类 Web Component | 同上                     |

**结论**：  
- Micro-app 的「类 Web Component + 极低接入成本」与**显式逃逸列表 + 按需读 rawWindow** 的设计，在**沙箱边界清晰度**和**逃逸可控性**上更优；with 沙箱下性能可接受，iframe 沙箱下性能和隔离都最好。  
- Qiankun 的 ProxySandbox 通过「只写 fakeWindow」实现多实例隔离，思路清晰，但在**读路径**上的 fallback、bound 以及不可配置属性、压缩后同名变量等场景下，逃逸与兼容问题更复杂，需要更多构建与运行时的配合。

若你希望，我可以把这份分析缩成一段「README 用对比小结」或加到 `STYLE-ISOLATION.md` 的「与其它方案对比」一节里。
