# CSS 样式隔离方案说明

基于 **standard-mf** 分支的样式隔离实现与业界方案对比。

## 1. 本项目采用的方案

采用 **「根节点包裹 + 选择器命名空间」** 的构建时方案，在子应用（producer）侧完成隔离，与 Module Federation 官方建议一致。

### 1.1 实现链路

| 环节         | 工具 / 机制                         | 作用                                                                                                    |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 打标         | **ModuleFederationComponentPlugin** | 识别被 MF 暴露的 Vue/JS 模块，为请求添加 `?mf`，并注入 mf-vue-section-loader                            |
| DOM 包裹     | **mf-vue-section-loader**           | 对带 `?mf` 的 Vue 文件，将 template/render 根节点包裹在 `<section class="remoteX-mf">` 中               |
| CSS 命名空间 | **postcss-selector-namespace**      | 对带 `resourceQuery: /mf/` 的 CSS 为选择器加上命名空间（如 `.remote1-mf`），使样式只作用于该 section 内 |

### 1.2 配置要点

- remote1：`wrapperClassName: 'remote1-mf'`，CSS 命名空间 `.remote1-mf`
- remote2：`wrapperClassName: 'remote2-mf'`，CSS 命名空间 `.remote2-mf`
- 仅对 **被 expose 的组件及其依赖链** 内的 Vue/CSS 生效，未暴露的代码不受影响

### 1.3 设计目的与常见疑问

**插件和 loader 不只是「加个 class」**  
做的是两件事，必须一起才能隔离：

- **Loader**：在 DOM 上给子应用一个「根」——`<section class="remoteX-mf">`，划清边界。
- **postcss-selector-namespace**：给这些模块的 CSS 选择器加上前缀 `.remoteX-mf`，使样式只作用在该 section 内。

若只有 DOM 根没有 CSS 前缀，子应用的 `.btn` 仍可能与 host/其他 remote 的 `.btn` 冲突；若只有 CSS 前缀没有 section 包裹，选择器没有对应的根节点，隔离也无法成立。因此目的是 **按子应用（remote）维度做样式隔离**。

**共享组件与 Vue Scoped 的关系**  
需区分两种「共享」：

- **MF 的 shared 依赖**（如 `vue`、`element-plus`）：来自 `node_modules`，在 plugin 里会被排除（不加 `?mf`），因此 **不会** 走「section 包裹 + postcss 命名空间」这套。共享组件库若已用 scoped，本身也不需要、也不会被加这套 class/命名空间。
- **子应用内部共用的 .vue 组件**（如 remote1 里的 `@/components/Widget.vue` 被 PageA/PageB 引用）：若在「被 expose 的组件的依赖链」里，会被打 `?mf`，就会包 section 并加命名空间。

Vue **scoped** 是「组件级」隔离（`[data-v-xxx]`），只防同一组件内的类名冲突，**不防**子应用与 host、子应用与子应用之间的类名冲突，也不防子应用内未 scoped 或全局样式污染 host。本方案的「根节点包裹 + 选择器命名空间」是在 **子应用边界** 再套一层，与 scoped 是不同层次：scoped 管组件内，本方案管子应用与 host/其他 remote 之间。

**原生 MF 的处理方式**  
官方明确 **不内置** CSS 隔离（与 shared 冲突、运行时边界多、Shadow DOM 兼容差等），建议在 **producer 侧** 自行处理：CSS Modules、组件库前缀、统一版本，或直接导出 Shadow DOM 组件。即：不做任何处理就是「无隔离」，靠约定或人工避免冲突；本项目的「wrapper + postcss-selector-namespace」即在 producer 构建时按官方建议补上这一层。

---

## 2. 与业界 / 官方的一致性

**方向一致。**

Module Federation 官方 [Style Isolation](https://module-federation.io/guide/basic/css-isolate) 明确 **不内置 CSS 隔离**，原因包括：

- 与 shared 依赖复用冲突，隔离边界难以控制
- 运行时处理样式存在大量边界情况，排查困难
- Shadow DOM 与各类组件库兼容问题多

官方建议：

- 在 **模块/子应用生产者（producer）侧** 处理 CSS，保证在任意消费环境中表现一致
- 可选用：CSS Modules、组件库前缀、统一版本，或直接导出 Shadow DOM 组件

本项目的「wrapper + postcss-selector-namespace」即在 **producer 构建时** 处理 CSS，与上述建议一致；「根节点包裹 + 选择器命名空间」也是 MF 与微前端社区常见做法之一。

---

## 3. 常见方案对比

| 方案                                 | 思路                                                               | 优点                                                                    | 缺点                                                                       |
| ------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **本项目：Wrapper + 选择器命名空间** | 构建时根节点包一层 `section.remoteX-mf`，CSS 用 postcss 加同名前缀 | 与 MF 官方建议一致；无运行时沙箱；与 Vue/组件库兼容好；实现简单、可预测 | 依赖构建管线；需保证暴露组件的样式都走带 `?mf` 的 pipeline；选择器变长     |
| **BEM / 命名约定**                   | 通过命名规范（如 `remote1-button__text`）避免冲突                  | 不依赖特殊构建、框架无关                                                | 依赖规范与人工遵守；易漏写；与现有组件库混用需额外约定                     |
| **CSS Modules**                      | 构建时把类名编译成唯一标识                                         | 组件级隔离、无全局污染                                                  | 主要解决组件内冲突，子应用间全局样式仍可能互相影响，需配合根节点或命名空间 |
| **CSS-in-JS**                        | 样式写在 JS，运行时/构建时生成唯一类名                             | 强隔离、可动态样式                                                      | 改造成本大；与部分 UI 库、全局主题、SSR 有兼容与性能考量                   |
| **Shadow DOM**                       | 子应用挂到 Shadow Root，样式封装在 shadow 内                       | 隔离最强、真正作用域隔离                                                | 与很多 Vue/React 组件库、弹窗、全局字体/主题兼容差；官方文档指出排查困难   |
| **Vue Scoped**                       | 编译时加 `data-v-xxx` 限定样式                                     | 组件内隔离、零配置                                                      | 只防本组件内冲突，不防子应用间、不防全局样式覆盖                           |

---

## 4. 本方案优缺点小结

### 优点

- **与 Module Federation 官方建议一致**：在 producer 构建时处理，不在 host 运行时做沙箱
- **无运行时沙箱**：不依赖 iframe、Proxy、动态插拔样式，行为可预期、易排查
- **与 Vue、现有组件库兼容好**：不引入 Shadow DOM，不强制 CSS-in-JS
- **按 remote 维度隔离**：每个子应用一个命名空间，子应用间、与 host 的样式互不污染

### 缺点

- **依赖构建配置**：只有「被 MF 暴露且带 `?mf` 的模块」的 CSS 会加命名空间；若有样式未走该 rule（如部分动态 import、第三方包内 CSS），可能漏隔离
- **需保证根节点唯一**：Vue 3 允许多根节点，当前 loader 只包一层；若结构复杂需确认所有需隔离的样式都在该 section 下
- **选择器变长**：所有规则前多一层 `.remoteX-mf`，体积与解析成本略增，一般可接受

---

## 5. 结论

当前 CSS 隔离方案与业界常见做法及 Module Federation 官方「在 producer 侧、构建时处理样式」的建议一致；采用「根节点包裹 + postcss-selector-namespace」在隔离强度、兼容性和实现复杂度之间取得较好平衡，适合作为本 MF demo 的默认方案。
