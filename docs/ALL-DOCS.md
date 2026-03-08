# 项目文档汇总（全文）

以下为仓库内所有 Markdown 文档的完整内容合并。https://github.com/lukemora/micro_frontend

---

## 一、mf/README.md

# Vue 3 + Monorepo + Webpack Module Federation Demo

基于 **Webpack 5 Module Federation** 的 Vue 3 微前端 demo：主应用 + 多子应用、多子路由、子应用暴露组件、**标准 MF 按需加载**（路由级 `import('remoteX/...')`）、**CSS 样式隔离**、**异构框架 Bridge 示例**（Vue Host 加载 React 子应用 remote3）。

> 本分支为 **standard-mf**：使用 Webpack 标准 `remotes` + 动态 `import('remote1/PageA')`。  
> 主包零引用 + 运行时 URL 方案见 **main** 分支（loadScript + getRemoteComponent）。

## 结构说明

- **apps/host**：主应用，Vue 3 + Vue Router；子应用路由使用标准 MF 动态 import：`component: () => import('remote1/PageA')`，首次进入该路由时 Webpack 按需加载对应 remote 的 remoteEntry；加载 **remote3（React）** 时使用 `@module-federation/bridge-vue3` 的 `createRemoteAppComponent` 做应用级 Bridge 集成。
- **apps/remote1**：子应用 1（Vue），暴露 `PageA`、`PageB`、`Widget`；使用 `ModuleFederationComponentPlugin` + `mf-vue-section-loader` 做根节点包裹，配合 `postcss-selector-namespace` 对暴露组件的 CSS 做 `.remote1-mf` 命名空间隔离。
- **apps/remote2**：子应用 2（Vue），暴露 `Dashboard`；同样使用插件/loader + `.remote2-mf` 命名空间做样式隔离。
- **apps/remote3**：子应用 3（**React**），通过 **Bridge** 以应用级暴露 `export-app`；使用 `@module-federation/bridge-react` 的 `createBridgeComponent` 包装根组件，供 Vue Host 用 `createRemoteAppComponent` 加载。详见 docs/BRIDGE-HETEROGENEOUS.md。
- **packages/mf-vue-isolation**：共享的 MF 样式隔离插件与 loader。

## 编码范式：标准 MF 按需加载

- 主应用在路由中直接使用 **动态 import**：`component: () => import('remote1/PageA')`、`import('remote2/Dashboard')`。
- Webpack 会为每个 remote 生成异步 chunk，**首次进入该子应用路由时**才加载对应 remoteEntry，未访问的子应用不加载。
- Remote URL 在 **host 的 webpack.config.js** 的 `remotes` 中配置；需运行时配置时可改为 Promise 型 remotes。

## CSS 样式隔离

- 子应用使用 **packages/mf-vue-isolation** 中的：
    - **ModuleFederationComponentPlugin**：识别被 Module Federation 暴露的 Vue/JS 模块，为其请求添加 `?mf`，并注入 **mf-vue-section-loader**。
    - **mf-vue-section-loader**：对带 `?mf` 的 Vue 文件，将 template 根与 render 根包裹在 `<section class="wrapperClassName">` 中（remote1 为 `remote1-mf`，remote2 为 `remote2-mf`）。
- 子应用 Webpack 中对 **带 `resourceQuery: /mf/` 的 CSS** 使用 **postcss-selector-namespace**，为选择器加上命名空间（如 `.remote1-mf`），从而只影响该 section 内的样式，与主应用及其他子应用隔离。
- 方案与业界对比、优缺点说明见 docs/CSS-ISOLATION.md。

## 如何运行

```bash
# 安装依赖（根目录）
pnpm install

# 同时启动 host + remote1 + remote2 + remote3（推荐）
pnpm dev

# 或分别启动
pnpm dev:host    # http://localhost:3000
pnpm dev:remote1 # http://localhost:3001
pnpm dev:remote2 # http://localhost:3002
pnpm dev:remote3 # http://localhost:3003
```

1. 打开 http://localhost:3000（主应用）。
2. 点击「Remote1 PageA」或「Remote1 PageB」：此时才会请求 `http://localhost:3001/remoteEntry.js`。
3. 点击「Remote2 Dashboard」：此时才会请求 `http://localhost:3002/remoteEntry.js`。
4. 点击「Remote3 (React)」：此时才会请求 `http://localhost:3003/remoteEntry.js`，并通过 Bridge 在 Vue 主应用中挂载 React 子应用。
5. 仅访问首页或 About 时，不会加载任何子应用 remoteEntry。

## 构建

```bash
pnpm build        # 构建所有应用
pnpm build:host
pnpm build:remote1
pnpm build:remote2
pnpm build:remote3
```

生产环境需将 **host** 的 `webpack.config.js` 中 `remotes` 的 URL 改为实际部署的 remoteEntry 地址（或 CDN）。

## 异构框架（Bridge）

- **remote3** 为 React 子应用，通过 Module Federation 官方的 **Bridge** 方案与 Vue 主应用集成。
- 子应用使用 `@module-federation/bridge-react` 的 `createBridgeComponent` 导出应用；主应用使用 `@module-federation/bridge-vue3` 的 `createRemoteAppComponent` 加载并挂载。
- 原理与最佳实践见 docs/BRIDGE-HETEROGENEOUS.md。

## 跨应用共享（状态 / API / 路由）

- **Host** 通过 MF 暴露：`./store`（Pinia）、`./sharedStateBridge`（与框架无关的状态桥）、`./api`（统一 API 客户端）、`./navigate`（驱动主应用路由）。
- **Vue 子应用**：使用 `host/store`、Vue Router；可按需使用 `host/api`、`host/navigate`。
- **React 子应用（remote3）**：使用 `host/sharedStateBridge` 与 Pinia 双向同步；使用 `host/api` 在 `@tanstack/react-query` 中请求；使用 `host/navigate` 跳转主应用路由。
- 详见 docs/CROSS-APP-SHARING.md。

---

## 二、mf/docs/CROSS-APP-SHARING.md

# 跨应用共享：组件、状态、路由与数据层

在 Vue Host + Vue/React 子应用（含 Bridge 异构）场景下，如何在 Host 与各子应用之间共享**组件**、**状态**（Pinia / Zustand）、**路由**以及**数据层**（axios / React Query）的说明与推荐做法。

---

## 1. 总体原则

- **框架相关**的运行时（Vue 组件、Pinia、Vue Router、React 组件、Zustand、React Router）**不能**跨框架直接复用，只能通过「**契约 + 桥接**」间接协作。
- 可共享的是：**与框架无关**的模块——纯 TS/JS 的**状态桥**、**API 客户端**、**导航函数**、**类型与常量**。
- 推荐：**Host 作为能力提供方**，通过 Module Federation 的 `exposes` 暴露「状态桥、API、导航」等；Vue 子应用继续用 Pinia/Vue Router，React 子应用用 Zustand/React Query/React Router，但**数据与行为**统一来自 Host 暴露的模块。

---

## 2. 组件跨框架复用

| 场景                                 | 可行性      | 做法                                                                                                                             |
| ------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Vue 子应用用 Host 的 Vue 组件        | ✅ 高       | Host 与子应用同属 Vue，shared 同一份 vue；Host 通过 `exposes` 暴露组件，子应用 `import('host/XXX')` 使用。                       |
| React 子应用用 Host 的 Vue 组件      | ❌ 不可直接 | 需「桥」：用 Web Components 或 Host 提供「在指定 DOM 上挂载 Vue 组件」的 API，React 侧只持有一个容器 div。复杂度高，一般不推荐。 |
| Host/Vue 子应用用 React 子应用的组件 | ❌ 不可直接 | 同构于上；若必须用，可把 React 组件包成 Web Component，或通过 Bridge 以**应用级**嵌入（当前 remote3 做法）。                     |
| **推荐**                             | -           | **组件不跨框架复用**；各应用各自维护 UI，通过**共享状态、API、路由**协同。                                                       |

**结论**：异构场景下组件级复用成本高，优先做**应用级**集成（Bridge）+ **共享数据与能力**（状态桥、API、导航）。

---

## 3. 状态共享：Pinia（Vue）与 Zustand（React）

- **Pinia** 只能在 Vue 环境用，**Zustand** 只能在 React 环境用，二者**不能**共用同一个 store 实例。
- 做法：由 Host 暴露一个**与框架无关的「状态桥」**（纯 TS：`getState` / `setState` / `subscribe`），Vue 用 Pinia 与之同步，React 用 Zustand 或 `useSyncExternalStore` 与之同步，实现**逻辑上的同一份全局状态**。

### 3.1 Host 暴露状态桥（推荐）

- 在 Host 中实现一个纯 TS 模块（例如 `shared/stateBridge.ts`）：
    - 维护一份普通对象 `state`；
    - 提供 `getState()`、`setState(partial)`、`subscribe(listener)`；
    - 不依赖 Vue/React。
- 在 Host 的 Module Federation 中 `exposes: { './sharedStateBridge': './src/shared/stateBridge.ts' }`。
- **Vue 侧**：Pinia 作为主应用状态源；在应用启动时从 `stateBridge.getState()` 初始化 Pinia，并 `stateBridge.subscribe` 把 Pinia 的变更写回 stateBridge；Vue 子应用若与 Host 共享 Pinia（当前 remote1/remote2 的 `host/store`），则无需再对接 stateBridge。
- **React 侧**：Remote3 通过 MF 动态加载 `host/sharedStateBridge`，用 `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` 订阅该桥，或封装成 Zustand 的 `subscribe` + `getState`，这样 React 侧看到的就是与 Host 同步的同一份数据。

### 3.2 使用方式小结

- **Vue 子应用**：继续使用 Host 暴露的 `host/store`（Pinia），与 Host 同源同 store。
- **React 子应用**：不直接用 Pinia，而是用 Host 暴露的 `host/sharedStateBridge`，在 React 内用 Zustand 或 `useSyncExternalStore` 与之同步；从「用户视角」看，与 Host / Vue 子应用看到的是同一套全局状态。

---

## 4. 路由协作

- **主路由**由 Host 的 Vue Router 控制；子应用（含 remote3）以**子路径**挂载（如 `/remote3`），Bridge 的 `basename` 已支持。
- **跨应用跳转**：Host 可暴露一个**导航函数** `navigate(path: string)`（内部用 `window.history.pushState` + 派发 `popstate`，或直接 `window.location.assign`），React 子应用调用该函数即可跳转到任意主应用路由；Vue 子应用已与 Host 共享 Vue Router，直接 `router.push(path)` 即可。

### 4.1 Host 暴露 navigate（推荐）

- 在 Host 中实现 `shared/navigate.ts`：接收 path，执行 `history.pushState` 并触发 `popstate`，以便 Vue Router 响应；或简单使用 `window.location.href = baseUrl + path`。
- `exposes: { './navigate': './src/shared/navigate.ts' }`。
- Remote3（React）在需要跳转时：先动态 `import('host/navigate')`，再调用 `navigate('/about')` 等。

---

## 5. 数据层：axios（Vue）与 React Query（React）

- **axios** 与 **@tanstack/react-query** 职责不同：前者是 HTTP 客户端，后者是请求 + 缓存 + 状态管理；二者可以**并存**。
- 推荐：**共享「请求能力」与「接口契约」**，不强行共享具体库。

### 5.1 推荐做法：Host 暴露统一 API 层

- 在 Host 中实现 **API 客户端模块**（如 `api/client.ts`）：
    - 使用 **axios**（或 fetch）实现具体请求（如 `getUser()`, `getList()`）；
    - 统一 baseURL、鉴权、错误处理；
    - 导出纯函数（如 `getUser(id)`, `getList()`），**不**导出 axios 或 React Query 本身。
- Host 的 `exposes` 增加 `'./api': './src/api/client.ts'`（或类似路径）。
- **Vue 应用**：继续在组件或 Pinia 中直接调用这些 API 函数（底层仍是 axios），或继续用现有 axios 封装。
- **React 应用**：通过 MF 动态 `import('host/api')` 得到 `getUser`、`getList` 等，在 `useQuery` 里使用这些函数即可，例如：
    - `useQuery({ queryKey: ['user', id], queryFn: () => getUser(id) })`  
      这样 React 侧用 React Query 做缓存与状态，但**请求逻辑**与 Host 一致（同一 API、同一鉴权）。

### 5.2 不在 React 里用 axios、不在 Vue 里用 React Query

- React 子应用**不必**引入 axios，只需使用 Host 暴露的 API 函数；数据获取用 React Query 即可。
- Vue 应用**不必**引入 React Query；继续用 axios + Pinia（或 composables）即可。
- 两边**共享**的是「同一套 API 定义与实现」（在 Host 的 api 模块里），而不是共享同一个库。

---

## 6. 本仓库已实现示例

### 6.1 Host 暴露

| 模块                  | 路径                        | 说明                                               |
| --------------------- | --------------------------- | -------------------------------------------------- |
| `./store`             | `src/store/index.ts`        | Pinia store（Vue 子应用用）                        |
| `./sharedStateBridge` | `src/shared/stateBridge.ts` | getState / setState / subscribe，与 Pinia 双向同步 |
| `./api`               | `src/api/client.ts`         | getList、getUser 等（fetch，与框架无关）           |
| `./navigate`          | `src/shared/navigate.ts`    | navigate(path)，驱动 Host Vue Router               |

### 6.2 Remote3（React）消费方式

- **状态**：`import('host/sharedStateBridge')` + `useSyncExternalStore(subscribe, getSnapshot)`（见 `useHostBridge.ts`）；React 内可再包一层 Zustand 的 subscribe/getState。
- **数据**：`import('host/api')` 得到 `getList` 等，在 `useQuery({ queryFn: () => getList() })` 中使用。
- **导航**：`import('host/navigate')` 得到 `navigate`，调用 `navigate('/about')` 即可跳转 Host 路由。

### 6.3 Vue 子应用（remote1/remote2）

- 继续使用 `host/store`（Pinia）、Vue Router；如需可 `import('host/api')`、`import('host/navigate')`。

这样在**不混用 Pinia/Zustand、不混用 axios/React Query** 的前提下，实现状态、路由、数据层在 Host 与各子应用（含异构）间的统一与复用。

---

## 7. 参考

- 状态桥模式与 `useSyncExternalStore`：[React 文档 - useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- 跨应用通信与共享依赖：Module Federation 官方 [Shared](https://module-federation.io/configure/shared)、[Bridge](https://module-federation.io/practice/bridge/overview)

---

## 三、mf/docs/BUNDLE-ANALYSIS.md

# 主包 (Host) 与子应用代码包含关系分析

基于 **standard-mf** 分支的 `pnpm build` 产物分析。

## 1. 构建产物一览

| 应用    | 产物             | 说明                                             |
| ------- | ---------------- | ------------------------------------------------ |
| host    | `main.[hash].js` | 主包：入口 + 路由 + 首页 + **remote 加载运行时** |
| host    | `320.[hash].js`  | 异步 chunk：About 页（本地组件）                 |
| remote1 | `remoteEntry.js` | 子应用 1 容器：PageA、PageB、Widget 等实际代码   |
| remote2 | `remoteEntry.js` | 子应用 2 容器：Dashboard 等实际代码              |

主应用 **不会** 把 PageA/PageB/Dashboard 的 Vue 源码打进自己的 bundle，只打进去「如何按需拉取」的逻辑和配置。

---

## 2. 主包里「包含」了哪些与子应用相关的内容？

主包（main.js）里与子应用相关的只有下面几类，**不包含**子应用组件的业务代码。

### 2.1 Remote 配置（写死在主包）

- 来自 `webpack.config.js` 的 `remotes`：
    - `remote1@http://localhost:3001/remoteEntry.js`
    - `remote2@http://localhost:3002/remoteEntry.js`
- 这些 **URL 字符串** 会出现在 main.js 里，用于运行时加载对应 remote 的 `remoteEntry.js`。

### 2.2 Remote 模块占位（约 18 bytes 级别）

构建日志中有：

```text
remote-module modules 18 bytes (remote) 18 bytes (share-init)
  remote remote1/PageA  6 bytes (remote) 6 bytes (share-init)
  + 2 modules  (即 remote1/PageB、remote2/Dashboard)
```

含义：

- 对每个 `import('remote1/PageA')` / `import('remote1/PageB')` / `import('remote2/Dashboard')`，Webpack 会在主包里生成一个 **占位模块**。
- 占位模块的代码量极小（几 byte 到十几 byte 级别），做的是同一件事：  
  「当这个模块被请求时，去加载对应 remote 的 container，再调用 `container.get(模块名)`，把拿到的 factory 执行后返回组件。」
- **不包含** PageA/PageB/Dashboard 的 Vue 组件源码，只包含「去 remote 要这个模块」的胶水逻辑。

### 2.3 运行时加载逻辑（Webpack 的 container 运行时）

- 主包里会有一段 Webpack Module Federation 的 **通用运行时**：
    - 根据 remotes 配置加载 remote 的 `remoteEntry.js`（例如通过动态插入 script 或类似机制）；
    - 初始化 share scope、调用 remote 的 `init`；
    - 在需要时调用 remote 的 `get(moduleName)`，拿到 factory 并执行，得到组件。
- 这段逻辑是「按 remote 名 + URL 去拉取」，不依赖子应用业务代码，所以体积相对固定，和子应用有多少页面无关（只和「用到了几个 remote、几个入口」有关）。

### 2.4 路由里对 remote 的引用

- 路由配置里类似：
    - `component: () => import('remote1/PageA')`
- 编译后变成：**当进入该路由时，加载 main 里对应的 remote 占位模块**；
- 占位模块执行时再触发「加载 remote1 的 remoteEntry → get('./PageA')」。
- 所以主包只包含「路由 → 占位模块」的映射和上述占位逻辑，**不包含** PageA 的组件实现。

---

## 3. 主包「不包含」什么？

| 不包含的内容                                 | 所在位置                                            |
| -------------------------------------------- | --------------------------------------------------- |
| PageA / PageB / Widget 的 Vue 组件与业务逻辑 | remote1 的 `remoteEntry.js`（或它异步拉取的 chunk） |
| Dashboard 的 Vue 组件与业务逻辑              | remote2 的 `remoteEntry.js`（或它异步拉取的 chunk） |
| 子应用的依赖（如子应用自己的 node_modules）  | 各自 remote 的 bundle                               |

也就是说：**子应用的「业务代码」和「依赖」都在子应用自己的 remoteEntry（及子应用自己的 chunk）里，主包只含「如何找到并加载这些 remote」的配置和胶水。**

---

## 4. 加载顺序（运行时）

1. 用户打开主应用 → 只下载 **main.js**（以及可能预加载的 320.js 等主应用自己的 chunk）。
2. 用户点击「Remote1 PageA」→ 路由触发 `import('remote1/PageA')`：
    - 主包里的 **remote 占位** 执行；
    - 发现 remote1 的 container 未加载 → 按配置请求 `http://localhost:3001/remoteEntry.js`；
    - 执行 remoteEntry，得到 container，再 `container.get('./PageA')`；
    - 返回的 factory 执行后得到 Vue 组件，渲染。
3. 若之后再点「Remote2 Dashboard」，再按同样流程加载 `remote2/remoteEntry.js` 并 `get('./Dashboard')`。

所以：**主包「包含」的是子应用的「引用方式 + 加载方式」，不包含子应用的真实实现代码。** 子应用代码始终在各自 remote 的 remoteEntry（及子应用自己的 chunk）里，按需加载。

---

## 5. 和 main 分支（loadScript 方案）的对比

| 项目                     | standard-mf（本分支）                      | main（loadScript）                                                                                                                     |
| ------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 主包里的 remote 相关代码 | remote 占位 + 运行时 + **remoteEntry URL** | 无 remote 占位；只有通用 `loadScript` + `getRemoteComponent`，**无** remote 名/URL 写死在主包（可完全从 REMOTE_APPS 等运行时配置读取） |
| 子应用业务代码所在       | 始终在 remote 的 remoteEntry               | 同左                                                                                                                                   |
| Remote URL               | 写在 webpack `remotes`，打进 main.js       | 不打进主包，可运行时配置                                                                                                               |

若要「主包完全不包含任何子应用 URL/名称」，需使用 main 分支的 loadScript 方案；若可接受主包内带 remote 的 URL 和占位逻辑，则 standard-mf 即可，且能享受标准 MF 的按需加载与类型声明（如 `remotes.d.ts`）。

---

## 6. 主包「零引用」是不是必要？实际优势在哪？

**结论：零引用不是必要能力**，只是多了一种架构选择。是否值得做，取决于你是否需要下面这些能力。

### 子应用独立发包：两种方案都支持

**标准 MF 同样支持子应用独立构建、独立部署**：remote1/remote2 各自打自己的包、发自己的版，主应用不用跟着发。子应用发新版本时，主应用无需重新构建或发版，只要 remote 的 shared 约定兼容即可。  
零引用**没有**在「子应用能否独立发包」上多出能力，两者在这点上一致。

### 零引用多出来的实际优势（相对标准 MF）

| 优势                                    | 说明                                                                                                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Remote URL 完全运行时配置**           | 主包不打进任何子应用地址，所有 remote 的 URL 可从接口、配置中心、环境变量下发，换域名/多环境不用改主包或重新发版。标准 MF 的 URL 写在 webpack `remotes` 里，改 URL 通常要重新构建主应用。                            |
| **主应用不改代码/不重建即可增删子应用** | 主包不依赖「有哪些 remote、叫什么名」的构建时信息，新增/下线子应用只改配置（如 REMOTE_APPS），主应用代码和构建产物可以不变。标准 MF 新增子应用通常要在 host 里加 `import('remote3/...')` 和 remotes 配置并重新构建。 |
| **合规与权限**                          | 主包不暴露子应用域名或入口，某些安全/合规场景下更易满足「主应用不携带未授权目标」的要求。                                                                                                                            |
| **主包体积与「认知」**                  | 主包少几十到几百 byte 的 remote 占位和 URL；体积差异很小，更多是「主应用不依赖子应用清单」的架构清晰度。                                                                                                             |

### 什么时候零引用不必要

- **子应用列表和 URL 基本固定**，且由同一团队/同一发布流程维护 → 标准 MF 的 `remotes` 写死在 webpack 即可，简单、类型友好。
- **不要求「不改主包就接入新子应用」** → 用标准 MF 更省心（`import('remoteX/...')` + `remotes.d.ts`）。
- **首屏性能已达标** → 主包多出的 remote 占位和 URL 体积很小，对首屏影响可忽略。

### 怎么选

- **需要「不改主包、只改配置就接/拆子应用」或「Remote URL 必须运行时下发」** → 零引用（loadScript 方案）有实际价值。
- **以上都不强需求** → 用标准 MF 更简单，零引用不必强求。

---

## 7. shared 单例与 lodash：依赖是否打进各子应用包？

在 apps 中安装 lodash，在 Module Federation 的 `shared` 里配置 **单例**，各应用均以**按需引入**方式使用（如 `import get from 'lodash/get'`、`import capitalize from 'lodash/capitalize'`、`import sum from 'lodash/sum'`），然后执行 `pnpm build` 观察构建产物。

### 结论：**会**——lodash 会出现在各子应用的包里

- **构建时**：host、remote1、remote2 各自**独立构建**，互不知道对方会提供什么。每个应用在编译时都会把自己用到的 `lodash/xxx` 子模块打进自己的 chunk（作为本应用的 fallback）。
- **构建日志**（节选）：
    - remote1：`modules by path .../lodash@4.17.23/.../lodash/*.js 13.2 KiB 21 modules`（capitalize 及其依赖链）
    - remote2：`modules by path .../lodash@4.17.23/.../lodash/*.js 1.39 KiB 3 modules`（sum、identity、\_baseSum）
- **单例** 只在**运行时**生效：当 host 与多个 remote 同时加载时，MF 运行时保证只使用**一份** lodash 实例，避免多份副本同时执行带来的状态/版本问题。单例**不会**在构建阶段把 lodash 从子应用 bundle 里剔除。
- 因此：若希望「lodash 只打一份、其它应用不重复打包」，需要在架构上让 **某一方（通常是 host）** 作为 lodash 的提供方，并让子应用在构建时**不**把 lodash 打进自己的包（例如通过 `shared.lodash.import: false` 或 externals 等方式，具体取决于所用 MF 版本和构建配置）；仅配置 `singleton: true` 不会自动去掉各应用 bundle 里的 lodash 代码。

### 子应用不打包 lodash 时，独立运行会怎样？

**会受影响**。若子应用构建时不把 lodash 打进自己的包（完全依赖 shared 从 host 获取），则子应用在**独立运行**时（直接访问子应用自己的 URL，无 host）没有谁往 share scope 里 provide lodash，子应用会拿不到依赖，报错或功能异常。

若既要**集成时单例**又要**子应用能独立运行**，应保留当前做法：子应用构建时**仍然**把 lodash 打进自己的包作为 **fallback**。这样在 host 里一起跑时用共享的那一份，单独跑子应用时用自己 bundle 里的 fallback，两不误。

### 业界最佳实践（shared 与子应用独立运行）

综合 Module Federation 官方文档与社区（如 [module-federation-examples#2219](https://github.com/module-federation/module-federation-examples/issues/2219)）的讨论，常见做法如下。

| 维度                            | 建议                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **是否让子应用不打包 shared？** | **一般不推荐**。子应用需要**独立运行**（单独打开子应用 URL、本地调试、被不同 host 接入）时，必须能在「无 host 提供 shared」时自给自足，因此应保留 **fallback**（即子应用构建时仍把该依赖打进自己的包）。只有确定子应用**永远不会独立运行**、且始终由同一 shell 先加载时，才考虑在 remote 上使用 `import: false` 不打包。 |
| **shared 放什么？**             | **按需配置，不要无脑 share 所有 package.json 依赖**。优先放：(1) **必须单例的**：Vue/React、Vue Router/React Router、Pinia/Redux、i18n 等有全局状态或上下文的；(2) **体积大且多应用共用的**：如 lodash、axios、大型 UI 库。注意：shared 的模块**无法被 tree-shake**，全量 share 大库可能反而增大首包。                   |
| **单例与版本**                  | 对必须单例的依赖使用 `singleton: true`，并用 `requiredVersion` 约束版本范围（如 `^4.17.21`），保证各应用版本兼容；运行时取满足要求的同一份实例。                                                                                                                                                                         |
| **集成 vs 独立运行**            | **主流做法**：各应用都声明同一 shared 配置（含 `requiredVersion`），且**不**设置 `import: false`，这样每个应用 bundle 里都有一份 fallback。集成时 MF 运行时用 share scope 里那一份（单例）；子应用独立运行时用自己 bundle 里的 fallback。用「重复打包一点体积」换「集成 + 独立运行都可用」。                             |
| **加载策略（MF 2.0）**          | `shareStrategy: 'version-first'` 严格按版本、初始化时加载所有 remote 的 entry 做版本协商，适合版本要求严的场景；`'loaded-first'` 按需复用已加载的 shared，容错更好（某个 remote 离线不会拖垮整站初始化），可按需选用。                                                                                                   |

**一句话**：需要子应用既能被 host 集成又能独立运行时，**保留 fallback（各应用都打包一份）是业界普遍做法**；只有在「子应用绝不独立运行」的前提下，才考虑让子应用不打包、完全依赖 host 提供。

---

## 四、mf/docs/CSS-ISOLATION.md

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

Module Federation 官方 [Style Isolation](https://module-federation.io/guide/basic/css-isolate) 明确 **不内置** CSS 隔离，原因包括：

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

---

## 五、mf/docs/BRIDGE-HETEROGENEOUS.md

# 异构框架与 Bridge 集成说明

本文档说明在本仓库中如何通过 **Module Federation Bridge** 在 Vue 主应用中加载 React 子应用（remote3），以及业界推荐做法。

## 1. 为什么需要 Bridge？

Module Federation 本身只做「模块加载 + 共享依赖」，不关心具体前端框架。不同框架（Vue / React）的组件无法互相直接渲染，因此需要一层**应用级契约**：

- **Remote** 不直接导出组件，而是导出一个 **Provider**：提供 `render(dom)` 与 `destroy(dom)`，在给定 DOM 上挂载/卸载应用。
- **Host** 只负责：准备一个 DOM 容器 → 加载远程模块 → 调用 `render(dom)`，卸载时调用 `destroy(dom)`。

这样 Host 与 Remote 通过「DOM + 生命周期」对接，与具体框架无关。Module Federation 官方将这套契约的实现称为 **Bridge**。

## 2. 本仓库中的实现

### 2.1 React 子应用（remote3）

- **位置**：`apps/remote3`
- **技术栈**：React 18 + Webpack 5 Module Federation + `@module-federation/bridge-react`

**导出入口**（`src/export-app.tsx`）：

```tsx
import App from './App';
import { createBridgeComponent } from '@module-federation/bridge-react';

export default createBridgeComponent({
	rootComponent: App,
});
```

**Webpack 配置要点**：

- `exposes: { './export-app': './src/export-app.tsx' }`
- `shared`: 只共享 `react`、`react-dom`（不要与 Host 共享 Vue；若使用 React Router，按官方建议不要将 `react-router-dom` 放入 shared，由 Bridge Router 处理）
- `@module-federation/bridge-react` 的 dist 会引用 `react-router-dom`，因此需在 remote3 的 devDependencies 中安装 `react-router-dom` 以便 Webpack 能解析（即使当前示例未使用路由）。

### 2.2 Vue 主应用（host）加载 remote3

- **依赖**：`@module-federation/bridge-vue3`
- **加载方式**：使用 `createRemoteAppComponent` 包装「加载 remote3/export-app」的 loader，得到可在路由中使用的 Vue 组件。

**封装组件**（`src/views/Remote3App.vue`）：

```vue
<script setup lang="ts">
import * as bridge from '@module-federation/bridge-vue3';
import { getRemoteComponent } from '../framework/micro';

const Remote3App = bridge.createRemoteAppComponent({
	loader: () => getRemoteComponent('remote3', 'export-app'),
	rootAttrs: { class: 'remote3-root' },
});
</script>

<template>
	<div class="remote3-wrapper">
		<Remote3App basename="/remote3" />
	</div>
</template>
```

**路由**：`/remote3/:pathMatch(.*)*` 指向该组件。主应用导航中增加「Remote3 (React)」链接。

**按需加载**：`getRemoteComponent('remote3', 'export-app')` 会先通过现有机制加载 remote3 的 remoteEntry，再取 `export-app` 模块；Bridge 的默认导出（Provider 工厂）由 `createRemoteAppComponent` 在内部用于在容器 DOM 上执行 `render` / `destroy`。

### 2.3 配置汇总

| 位置                            | 配置说明                                                                 |
| ------------------------------- | ------------------------------------------------------------------------ |
| host `webpack.config.js`        | `remotes` 增加 `remote3: 'remote3@http://localhost:3003/remoteEntry.js'` |
| host `framework/micro/index.ts` | `REMOTE_APPS` 增加 remote3 的 `name`、`chunk`、`routePrefix`             |
| host `util/remote.ts`           | `Window` 类型中增加 `remote3` 的 container 类型（供 loadComponent 使用） |

## 3. 业界最佳实践摘要

1. **各用各的 shared**
    - Host（Vue）只共享 vue、vue-router、pinia 等。
    - React Remote 只共享 react、react-dom 等。
    - 不要跨框架共享 UI 库；通用库（如 lodash）可按需在两边都声明 shared。

2. **Bridge 契约**
    - Remote 使用 `createBridgeComponent` 导出**应用级**模块（含根组件与可选路由）。
    - Host 使用 `createRemoteAppComponent` 的 loader 加载该模块，由 Bridge 负责在容器 DOM 上挂载/卸载。

3. **路由**
    - Bridge 支持通过 `basename`、`memoryRoute` 等与主应用路由协作。
    - 若 React 子应用使用 React Router，可在构建侧开启 `enableBridgeRouter`，由 Bridge 注入 basename 与路由上下文。

4. **生命周期**
    - 挂载：Host 提供 DOM → 调用 provider.render(dom) → 子应用挂载。
    - 卸载：路由离开或组件销毁时调用 provider.destroy(dom)，避免重复挂载与内存泄漏。

## 4. 参考

- [Module Federation - Bridge Overview](https://module-federation.io/practice/bridge/overview)
- [React Bridge - Export / Load App](https://module-federation.io/practice/bridge/react-bridge/export-app)、[Load App](https://module-federation.io/practice/bridge/react-bridge/load-app)
- [Vue Bridge (Vue 3)](https://module-federation.io/practice/bridge/vue-bridge)

---

## 六、mf/docs/SHARED-DEPENDENCIES-PITFALLS.md

# Module Federation 共享依赖的坑与解决方案

MF 允许通过 `shared` 配置在主机与微应用之间共享依赖（如 vue、vue-router、element-plus），避免每个应用各自打包一份，减少冗余。理想很丰满，现实常遇到两类问题：**版本冲突** 和 **幽灵依赖**。本文说明原因、在本仓库中的演示方式，以及推荐解决方案。

---

## 坑一：版本冲突

### 现象

主应用和微应用都强依赖同一批基础库（如 vue、vue-router、pinia、element-plus）。若：

- A 应用偷偷升级了 vue-router 小版本，或
- B 应用用了不同版本的 element-plus，

而主应用又对它们配置了 **singleton: true**（整个联邦只允许一个实例），则：

- 运行时可能直接报错（如 Vue 或 Router 实例不兼容），或
- 控制台出现版本不满足 `requiredVersion` 的警告，行为不可预期。

### 原因

- **singleton** 表示“全联邦共用同一份该依赖”。一旦版本不一致，MF 会选一个版本来用（通常是满足 `requiredVersion` 的某一方），其它方可能拿到的是为另一版本编译的代码，导致运行时错乱。
- 各应用 `package.json` 里写的版本范围（如 `^4.2.0`）在各自 `pnpm install` 时可能解析到不同的小版本，导致“本地能跑、线上报错”或反之。

### 在本仓库中的演示

- **Host / Remote1**：使用 `element-plus@^2.4.0`，且在各自 `shared` 中配置 `element-plus: { singleton: true }`。
- **Remote2**：在 `package.json` 中写死 `element-plus@2.2.0`（与主应用不一致），同样在 `shared` 里配置 singleton。

运行方式：

```bash
cd mf && pnpm install
pnpm dev
```

当前仓库根目录 `package.json` 已配置 **pnpm.overrides**，将 element-plus 统一为 `2.4.x`，因此安装后各应用版本一致，**不会**出现版本冲突警告。若想**复现版本冲突**：暂时删除或注释掉 `mf/package.json` 中的 `pnpm.overrides`，在 `apps/remote2/package.json` 中保持 `"element-plus": "2.2.0"`，重新执行 `pnpm install` 后启动。打开主应用并进入 **Remote2 Dashboard**，在控制台可看到 MF 关于 **element-plus** 版本不满足要求的警告；若继续使用 singleton，可能出现样式或组件行为异常。

**解决方式**：见下文「解决方案 1：强制版本一致」。

---

## 坑二：幽灵依赖

### 现象

- 微应用 A 的代码里用了某个依赖（如 `axios`），但 **没有** 在 A 的 `shared` 里声明；
- 主应用在 `shared` 里提供了 `axios`，所以本地联调时（主应用先加载，再加载 A）一切正常；
- 上生产后：若主应用没有先加载 A、或 A 先于主应用加载、或部署拓扑变化导致 A 独立运行，则 A 拿不到 `axios`，直接 **白屏或运行时报错**。

即：依赖“看起来有”（因为主应用 share 了），但对 A 而言是“幽灵”——没有在 A 侧显式约定，一旦运行顺序或环境变化就失效。

### 原因

- 在 MF 里，谁 **提供** shared 依赖是由“当前运行时谁先挂载、以及各应用的 `shared` 配置”共同决定的。
- 若 A 不把 `axios` 列入自己的 `shared`，且用 `import: false` 表示“自己不打包、只用别人的”，则 A 的构建不会包含 `axios`，运行时就 **必须** 由宿主或其它方提供；若没有提供方，就会报错。
- 若 A 没有用 `import: false`，则 A 会自己打一份 `axios`，和主应用的 `axios` 各有一份，可能造成“双实例”、请求拦截器不一致等问题，也属于依赖未统一约定。

### 在本仓库中的演示

- **Host**：在 `package.json` 中依赖 `axios`，并在 `shared` 中配置 `axios: { singleton: true }`，即主应用提供 `axios`。
- **Remote1**：在 **PageB** 中使用 `import axios from 'axios'` 发请求，但在 Remote1 的 `shared` 中配置 `axios: { import: false, singleton: true }`，即 **不打包 axios、只使用宿主提供的单例**；且 Remote1 的 `package.json` 不声明 `axios`，构建时不会把 axios 打进 Remote1 的 bundle。

结果：

- **先打开主应用，再进入 Remote1 PageB**：主应用已提供 `axios`，Remote1 使用该单例，请求正常。
- **单独起 Remote1**（如只打开 `http://localhost:3001`，不通过主应用加载）：没有宿主提供 `axios`，运行时报错（例如 “Shared module is not available for eager consumption” 或 axios 未定义），即“幽灵依赖”导致的白屏/报错。

---

## 解决方案概览

### 方案 1：强制 singleton + 版本拉齐（resolutions）

- 所有需要共用的基础库（vue、vue-router、pinia、element-plus 等）在 **各应用** 的 `shared` 里都配置为 **singleton: true**，必要时加上 **requiredVersion**，避免多实例。
- 在 **根 package.json**（pnpm 项目）用 **resolutions**（或 **overrides**）把上述库的版本锁成一致，例如：

```json
{
	"pnpm": {
		"overrides": {
			"vue": "3.4.x",
			"vue-router": "4.2.x",
			"pinia": "2.1.x",
			"element-plus": "2.4.x"
		}
	}
}
```

这样所有应用解析到的都是同一版本，从根源上避免“主应用和微应用版本不一致”的问题。本仓库在 `mf/package.json` 中提供了 `pnpm.overrides` 示例；保持该配置并执行 `pnpm install` 后，Remote2 与 Host/Remote1 会使用同一 element-plus 版本，控制台版本冲突警告消失。

### 方案 2：建立“依赖画像”——shared-manifest.json

#### 要解决什么问题

- 主应用和多个子应用各自在 webpack 里写 `shared: { vue: ..., axios: ... }`，容易**漏写**（子应用用了 axios 但没 share → 幽灵依赖）或**写错版本**（各写各的 → 版本冲突）。
- 希望有一份**唯一的清单**：哪些依赖必须被共享、谁在用，主应用按清单统一 provide，子应用只“用”、不自己决定 share 什么。

#### “依赖画像”是什么

就是一份 **shared-manifest.json** 文件，里面记录两件事：

1. **有哪些依赖要共享**：例如 vue、vue-router、pinia、lodash、axios、element-plus……
2. **每个依赖被哪些应用用到了**（usedBy）：例如 `axios` 被 host、remote1 用到；`vue` 被 host、remote1、remote2 用到。

这份文件不靠人手维护，而是**用脚本根据各应用的 package.json 自动扫出来的**，所以叫“画像”——把“谁在用哪些共享依赖”画出来。

#### 方案 2 的完整流程（三步）

- **第 1 步**：`pnpm run shared-manifest` → 脚本扫 apps 的 package.json，写出 shared-manifest.json（带 usedBy）。
- **第 2 步**：Host 构建时 webpack.config.js 读 shared-manifest.json，用 scripts/shared-config-from-manifest.js 转成 webpack shared 配置。
- **第 3 步**：子应用只“用”、不自己 provide；约定子应用不要在 shared 里私自加清单外的依赖。

**主应用**：以 shared-manifest.json 为**唯一真相**，统一在 `shared` 里提供这些依赖。**微应用**：只使用这些依赖，缺什么就提需求“把某某库加进 manifest”。

#### 本仓库里方案 2 的落点

- 脚本：`scripts/generate-shared-manifest.js` 生成 `shared-manifest.json`。
- Host 用清单：`scripts/shared-config-from-manifest.js` 把 manifest 转成 webpack shared；`apps/host/webpack.config.js` 构建时读 manifest。
- 跑 `pnpm run validate-shared` 会按应用汇总打印，例如「remote1（从 Host 消费）: vue, vue-router, pinia, lodash, axios」。

---

## 本仓库相关文件

| 文件                                     | 说明                                                          |
| ---------------------------------------- | ------------------------------------------------------------- |
| `apps/host/webpack.config.js`            | 主应用 shared 配置                                            |
| `apps/remote1/webpack.config.js`         | Remote1 shared；axios 使用 `import: false` 演示幽灵依赖       |
| `apps/remote2/webpack.config.js`         | Remote2 shared；element-plus 版本与 host 不一致以演示版本冲突 |
| `apps/remote1/src/views/PageB.vue`       | 使用 axios 的页面（幽灵依赖演示）                             |
| `apps/remote2/src/views/Dashboard.vue`   | 使用 element-plus 的页面（版本冲突演示）                      |
| `package.json`                           | 根 resolutions/overrides 示例                                 |
| `scripts/generate-shared-manifest.js`    | 生成 shared-manifest.json 的脚本                              |
| `scripts/shared-config-from-manifest.js` | 供 Host 读取 manifest 并生成 webpack shared 配置              |
| `scripts/validate-shared-manifest.js`    | 展示各 shared 的 usedBy 及按应用汇总                          |

- 运行 `pnpm run shared-manifest` 可重新生成 `shared-manifest.json`。
- 运行 `pnpm run validate-shared` 可查看每个 shared 依赖被谁消费及按应用汇总。

### 怎么看 shared-manifest.json 作用到了 remote1

1. **构建链路**：Host 的 webpack.config.js 会读取 shared-manifest.json，用 shared-config-from-manifest.js 生成 shared 配置；manifest 里列出的依赖都会由 Host 统一 provide。remote1 被 Host 加载时，从同一个 shared 作用域里拿这些依赖。
2. **看 usedBy**：打开 shared-manifest.json，每个依赖下有 `usedBy` 数组。例如 `"axios": { "usedBy": ["host", "remote1"] }` 表示 remote1 会从 Host 获取 axios。
3. **跑校验脚本**：在 mf 目录执行 `pnpm run validate-shared`，会打印按应用汇总「remote1（从 Host 消费）: vue, vue-router, pinia, lodash, axios」。

---

## 七、micro-app/README.md

# Micro-App 微前端 Demo（京东 micro-app）

与同目录下 `mf`（Module Federation）、`wujie` 场景一致：**host** 主应用 + **remote1**、**remote2**、**remote3** 子应用，用于对比 micro-app 与 MF、Wujie 的实现方式。

## Micro-App 实现方式简述

- **技术原理**：基于 **WebComponents**，通过 CustomElement 定义 `<micro-app>` 标签，结合 **自定义 Shadow DOM** 加载子应用 HTML，在沙箱中执行子应用 JS、隔离样式。
- **加载方式**：主应用通过 `<micro-app name="xxx" url="子应用 index.html 地址" />` 嵌入子应用；url 必须指向子应用的 **index.html**，micro-app 会解析 HTML 并补全静态资源（js、css）地址。
- **子应用改造**：子应用只需 **支持跨域**（如 Vite `server.cors: true`）；可选在微前端环境下使用 `window.__MICRO_APP_BASE_ROUTE__` 设置 Vue Router / React Router 的 base，以配合主应用路由。
- **与 MF / Wujie 对比**：见下方表格。

## 运行方式

```bash
# 在 micro-app 目录下
pnpm install
pnpm dev
```

会并行启动：**Host** http://localhost:5000；**Remote1** 5001；**Remote2** 5002；**Remote3** 5003。浏览器访问 http://localhost:5000，通过主导航切换「首页 / About / 样式隔离 / Remote1 PageA·PageB / Remote2 Dashboard / Remote3」。

也可单独启动：`pnpm dev:host`、`pnpm dev:remote1` 等。

## 三种微前端方案对比

| 维度              | Module Federation (mf)                       | Wujie 无界                           | Micro-App（本 demo）                        |
| ----------------- | -------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| **加载方式**      | 远程模块 remoteEntry + 按需 import 组件/页面 | 子应用 URL，iframe 运行              | 子应用 URL，CustomElement + Shadow DOM 沙箱 |
| **子应用形态**    | 暴露若干模块（如 PageA、Dashboard）          | 独立 SPA，整页加载                   | 独立 SPA，整页 HTML 被解析注入              |
| **技术栈**        | Webpack + ModuleFederationPlugin             | Vite，无 MF 配置                     | Vite，主应用 @micro-zoe/micro-app           |
| **样式/脚本隔离** | 同文档，依赖 CSS 命名空间等                  | iframe 天然隔离                      | Shadow DOM + 沙箱隔离                       |
| **主应用集成**    | `import('remote1/PageA')`                    | `<WujieVue name="xxx" :url="url" />` | `<micro-app name="xxx" url="..." />`        |
| **子应用改造**    | 需 exposes、shared、独立运行入口             | 可零改造，需 CORS                    | 仅需 CORS，可选 baseroute                   |

## 目录结构

micro-app/ 下 apps/host、remote1、remote2、remote3；docs/STYLE-ISOLATION.md；package.json；pnpm-workspace.yaml；README.md。

## 关键实现要点

1. **主应用 (host)**：安装 `@micro-zoe/micro-app`，在 main.ts 中执行 `microApp.start()`。Vue 3 需在 Vite 的 vue 插件中配置 `compilerOptions.isCustomElement: (tag) => tag === 'micro-app'`。各子应用页面对应一个路由组件，使用 `<micro-app name="唯一名" :url="子应用 index.html 地址" default-page="子应用内路径" />`。**Vite 子应用**需使用 **iframe 沙箱**：本 demo 在 main.ts 中已配置 `microApp.start({ iframe: true })`。

2. **子应用 (remote1/2/3)**：普通 Vite 项目，配置 server.port 与 server.cors: true。无需强制改造入口；若需与主应用路由一致，可在创建 router 时使用 `window.__MICRO_APP_BASE_ROUTE__ || '/'` 作为 base。

3. **与 mf / wujie 的对比**：MF 主应用和子应用可共享 Vue/Router/Pinia 等运行时。Wujie 主、子 iframe 隔离，通信靠 props、bus。Micro-App 主、子在同一文档下的 Shadow DOM 与沙箱中，可依赖数据通信 API（如 microApp.setData、子应用 window.microApp.addDataListener）做通信。

## 子应用使用 Host 的 Pinia

因 micro-app 下主、子应用 JS 隔离，子应用不能直接 `import('host/store')`。本 demo 通过 **micro-app 数据通信** 同步：主应用在 useSubAppState.ts 中 setupHostStoreSync() 订阅 Pinia，store 变化时对各个子应用 name 调用 `microApp.setData(name, { hostStore: { count, userName } })`；监听各 `<micro-app>` 的 `@datachange`，若 data.type === 'host:action' 则执行 store 的 increment / setUserName。子应用在 composable（Vue）或 hook（React）中 `window.microApp.addDataListener` 更新本地 ref/state；按钮调用 `window.microApp.dispatch({ type: 'host:action', payload })`。子应用侧封装：**useHostStore()**。

## Host 使用子应用的状态

子应用内部维护自己的状态（如 remote1 的 localCount、message，remote2 的 statsClicks），在变化时通过 **dispatch** 上报：子应用 `window.microApp.dispatch({ type: 'remote1:store', localCount, message })`；主应用在各 `<micro-app>` 上监听 `@datachange`，在 useSubAppState() 的 handleDatachange 中解析 data.type，更新 remote1State / remote2State，在顶部「子应用状态」面板展示。

## 样式隔离

主应用导航中提供「样式隔离」（路由 /style-isolation）。方案说明见 docs/STYLE-ISOLATION.md。要点：默认（scopecss 开启）子应用选择器加 micro-app[name=xxx] 前缀，防子→主；不防主→子（with 沙箱时）。iframe 沙箱（本 demo）主/子应用分属不同文档，样式天然双向隔离。disable-scopecss 关闭样式隔离，可提升性能，需避免应用间类名冲突。

## 参考

- [Micro-App 官方文档](https://micro-zoe.github.io/doc/zh/)
- [GitHub @micro-zoe/micro-app](https://github.com/micro-zoe/micro-app)

---

## 八、micro-app/docs/STYLE-ISOLATION.md

# Micro-App 样式隔离方案说明

本文档说明本 demo 中 Micro-App 的样式隔离机制、可选配置及与其它微前端方案的对比。

## 一、Micro-App 默认行为（scopecss 开启）

- **子应用 → 主应用**：框架会为子应用加载的 CSS 选择器添加 **`micro-app[name=xxx]`** 前缀，使子应用的样式只作用于对应的 `<micro-app>` 容器内部，从而 **防止子应用样式泄漏到主应用**，避免与主应用或其它子应用的类名冲突。
- **主应用 → 子应用**：该机制 **不能阻止主应用样式影响子应用**。主应用文档中的全局样式（如标签选择器 `div`、`p`，或未加前缀的类选择器）仍可能命中子应用根下的 DOM（在 with 沙箱下子应用与主应用同文档），造成主应用「污染」子应用。

因此，若使用 **with 沙箱**，建议主应用尽量保持样式收敛（如仅使用 scoped、BEM 或主应用统一前缀），或通过约定/工具给主应用选择器加前缀。

## 二、disable-scopecss：关闭样式隔离

- **配置方式**：在 `microApp.start()` 中传入 `'disable-scopecss': true` 全局关闭，或在单个 `<micro-app>` 上设置 `disable-scopecss` 属性。
- **效果**：子应用 CSS 不再添加 `micro-app[name=xxx]` 前缀，子应用样式可能影响主应用及其它子应用。
- **适用场景**：需要提升渲染性能、且能保证各应用之间无类名/选择器冲突时；或需要子应用样式覆盖主应用某区域时（慎用）。

## 三、沙箱模式对样式的影响

| 沙箱类型        | 子应用运行环境                | 主应用样式 → 子应用                         | 子应用样式 → 主应用   |
| --------------- | ----------------------------- | ------------------------------------------- | --------------------- |
| **with 沙箱**   | 主文档内（通常为 Shadow DOM） | 可能穿透（取决于实现）；scopecss 不防此方向 | scopecss 前缀防止泄漏 |
| **iframe 沙箱** | 独立 iframe 文档              | 不穿透，完全隔离                            | 不穿透，完全隔离      |

本 demo 使用 **iframe 沙箱**（`microApp.start({ iframe: true })`），主应用与子应用分属不同文档，因此 **主/子应用样式天然互不影响**，无需依赖 scopecss 即可实现双向隔离。scopecss 在 iframe 模式下仍会对子应用内部样式做前缀处理，但对「主↔子」隔离无额外影响。

## 四、常见问题与建议

1. **主应用样式影响到子应用（with 沙箱）**：给主应用样式加统一前缀（如 PostCSS 插件），或使用 Vue scoped / CSS Modules，减少全局选择器；或改用 iframe 沙箱。
2. **子应用样式影响到主应用**：保持 scopecss 开启（默认）；若关闭，需保证子应用类名与主应用不冲突，或子应用自身使用 BEM/前缀。
3. **弹窗、抽屉等挂到 body 的组件**：若挂载到主文档 body，会受主应用样式影响；可考虑挂到子应用根节点内，或通过主应用提供的「全局弹窗」能力由主应用渲染。
4. **性能**：关闭 disable-scopecss 可减少样式处理开销，在确认无冲突前提下可按需开启。

## 五、与其它微前端方案对比

| 方案                                      | 隔离方式                                        | 说明                                           |
| ----------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| **Micro-App（scopecss）**                 | 子应用选择器加 `micro-app[name=xxx]` 前缀       | 防子→主；不防主→子（with 沙箱时）              |
| **Micro-App（iframe）**                   | 子应用在 iframe 内                              | 主/子双向隔离                                  |
| **Wujie**                                 | iframe                                          | 主/子双向隔离                                  |
| **qiankun（experimentalStyleIsolation）** | 子应用根节点加 `data-qiankun-xxx`，选择器加前缀 | 防子→主；不防主→子                             |
| **Module Federation**                     | 同文档，无内置隔离                              | 依赖各自项目的 CSS 命名空间、BEM、或构建时前缀 |

## 六、本 demo 中的演示

主应用导航中提供「样式隔离」入口（`/style-isolation`），内含方案说明摘要、主应用区域与子应用区域的并排演示（iframe 沙箱下两区域样式互不污染）、与其它方案的对比表。详细方案说明以本文档为准。

---

## 九、micro-app/docs/SANDBOX-AND-ESCAPE-ANALYSIS.md

# Micro-App 与 Qiankun：沙箱性能与逃逸问题对比分析

本文从**沙箱实现思路**、**性能**和**逃逸处理**三方面对比 micro-app 与 qiankun。

## 一、沙箱实现思路对比

### 1.1 Qiankun：fakeWindow + 只写副本

- **SnapshotSandbox**：遍历 window 做快照，卸载时按 diff 还原。兼容性好，但性能差，且只适合单实例。
- **LegacySandbox**：单应用 Proxy，仍会写真实 window，多实例会互相污染。
- **ProxySandbox**（多实例）：为每个子应用创建 **fakeWindow**（从真实 window 拷贝属性到空对象）；用 Proxy 代理 fakeWindow：get 优先 fakeWindow，没有再 fallback 到真实 window（并对函数 bind）；set **只写 fakeWindow**，不写真实 window。隔离依赖「写操作不落真实 window」；读操作通过 fallback 共享全局能力，但需要处理 bound 的 this 和不可配置属性。

### 1.2 Micro-App：microAppWindow（空对象）+ Proxy + 明确逃逸

- **With 沙箱**：每个子应用一个 **microAppWindow**（空对象），不拷贝 window 属性。Proxy：get 优先 microAppWindow，再 scopeProperties，否则从 rawWindow 读（函数 bind(rawWindow)）；set 默认写 microAppWindow，只有少数 key（如 location）写 rawWindow，另有 **escapeProperties** 显式「允许逃逸」到 rawWindow。子应用代码通过 with(proxyWindow.**MICRO_APP_WINDOW**) + IIFE 包一层。**默认不污染真实 window**，只有显式列入 escapeProperties 的才写 rawWindow。
- **iframe 沙箱**：子应用在独立 iframe 的 document 中执行，没有 with，也没有对主 window 的 Proxy；天然隔离，无 Proxy 逃逸问题；Vite 等 module 子应用必须用 iframe 沙箱。

## 二、逃逸问题处理方式对比

- **沙箱逃逸**：子应用访问或修改到真实 window/document 或其它子应用环境，导致隔离失效。**合理逃逸**：某些全局单例必须挂在真实 window 上，需要「受控逃逸」。
- **Qiankun**：set 只写 fakeWindow，防污染；但 get 的 fallback 与 bound 带来不可配置属性、同名变量等边界问题（如 Issue #2456）。
- **Micro-App**：**显式逃逸列表** escapeProperties/staticEscapeProperties；set 这些 key 时同时 Reflect.set(rawWindow)，并加入 escapeKeys；**卸载时**遍历 escapeKeys 执行 deleteProperty(rawWindow)，恢复主应用环境。**scopeProperties**（如 Vue、webpackJsonp、onpopstate）只在 microAppWindow 上读写。**injectedKeys** 与 **escapeKeys** 在卸载时分别从 microAppWindow 和 rawWindow 上 delete。逃逸路径明确，更容易控制和排查。

## 三、性能对比

| 维度         | Qiankun                           | Micro-App（with 沙箱）                 | Micro-App（iframe 沙箱） |
| ------------ | --------------------------------- | -------------------------------------- | ------------------------ |
| 沙箱数据结构 | fakeWindow 需拷贝 window 部分属性 | microAppWindow 空对象，不拷贝          | 无主 window 代理         |
| get 开销     | 先 fakeWindow 再 rawWindow + bind | 先 microAppWindow 再 rawWindow+bind    | 直接 iframe window       |
| set 开销     | 只写 fakeWindow                   | 多数写 microAppWindow，少数写 raw      | 只写 iframe window       |
| 特殊语法     | 无 with                           | 一层 with                              | 无 with                  |
| 快照/还原    | SnapshotSandbox 有整表遍历        | 无快照，仅清理 injectedKeys/escapeKeys | 无                       |

**结论**：Micro-app 显式逃逸列表 + 按需读 rawWindow，沙箱边界清晰度与逃逸可控性更优；iframe 沙箱下性能和隔离都最好。Qiankun 在读路径上的 fallback、bound 以及不可配置属性、压缩后同名变量等场景下，逃逸与兼容问题更复杂。

---

## 十、wujie/README.md

# Wujie 无界 微前端 Demo

与同目录下 `mf`（Module Federation）场景一致：**host** 主应用 + **remote1**、**remote2**、**remote3** 子应用，用于对比 Wujie 与 MF 的实现方式。

## 运行方式

```bash
# 在 wujie 目录下
pnpm install
pnpm dev
```

会并行启动：**Host** http://localhost:4000；**Remote1** 4001；**Remote2** 4002；**Remote3** 4003。浏览器访问 http://localhost:4000，通过主导航切换「首页 / About / Remote1 PageA·PageB / Remote2 Dashboard / Remote3」。也可单独启动：pnpm dev:host、pnpm dev:remote1 等。

## Wujie 与 MF 的差异

| 维度              | Module Federation (mf)                                       | Wujie 无界 (本 demo)                                  |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| **加载方式**      | 主应用通过远程模块（remoteEntry + exposes）按需加载组件/页面 | 主应用通过子应用 URL 加载整页，子应用在 iframe 中运行 |
| **子应用形态**    | 打包出 remoteEntry，暴露若干模块                             | 独立 SPA，可单独打开                                  |
| **技术栈**        | Webpack + ModuleFederationPlugin                             | Vite，子应用无需 MF 配置                              |
| **样式/脚本隔离** | 同主应用文档，依赖 shared、CSS 命名空间等                    | iframe 天然隔离                                       |
| **依赖共享**      | 通过 shared 配置共享 vue、vue-router、pinia 等               | 不共享运行时，通信可用 props、bus                     |
| **主应用集成**    | 路由里 import('remote1/PageA') 等                            | 路由里渲染 `<WujieVue name="xxx" :url="子应用URL" />` |
| **子应用改造**    | 需配置 exposes、shared、独立运行入口                         | 保活/重建模式下子应用可零改造；需 CORS                |

## 目录结构

wujie/ 下 apps/host、remote1、remote2、remote3；package.json；pnpm-workspace.yaml；README.md。

## 关键实现要点

1. **主应用 (host)**：使用 wujie-vue3，在 main.ts 中 app.use(WujieVue)。各子应用页面对应一个路由组件，使用 `<WujieVue name="唯一名" :url="子应用完整 URL" :alive="true" />`。
2. **子应用 (remote1/2/3)**：普通 Vite 项目，配置 server.port 与 server.cors: true。无需 Wujie 生命周期改造。主应用通过不同 path 加载不同页面。
3. **与 mf 的对比**：MF 主应用和子应用共享 Vue/Router/Pinia；Wujie 主、子应用隔离，若需通信可使用无界 bus 或主应用通过 props 向子应用传参。

## 子应用使用 Host 的 Pinia

因 iframe 与主应用 JS 隔离，不能直接 import('host/store')。本 demo 通过 **bus 事件** 同步：Host 在 bus/index.ts 中订阅 Pinia，store 变化时 bus.$emit('host:store', { count, userName })；监听 host:action、host:requestStore。子应用 bus.$on('host:store', ...) 更新本地 ref/state，按钮调用 bus.$emit('host:action', { type, payload })。子应用侧封装：useHostStore()。

## Host 使用子应用的状态

子应用在变化时通过 bus 上报：bus.$emit('remote1:store', { localCount, message })（remote2 同理）。Host 在 useSubAppState() 中 bus.$on('remote1:store', ...) / bus.$on('remote2:store', ...)，将结果展示在顶部「子应用状态」面板。

## 全局弹窗（iframe 方案下的常见痛点）

在 iframe 内写的弹窗只能盖住该 iframe 区域。本 demo：**弹窗由主应用提供**，在 Host 中挂载 `<GlobalModal />`（Teleport to="body"），监听 bus 事件 global:openModal / global:closeModal。**子应用只负责「发起」**：bus.$emit('global:openModal', { title, content })；主应用在主文档中渲染遮罩和弹窗，可覆盖整个视口。

### 子应用对弹窗样式的修改

弹窗 DOM 在主应用文档中，子应用无法直接写主应用 CSS。本 demo：子应用在打开弹窗时通过 payload 传 **styleOptions**，由主应用校验后应用。协议：global:openModal 的 payload 支持可选 styleOptions: { className?, theme?, width?, style? }。主应用规则：className 只接受以 sub-modal- 为前缀的 class；theme 枚举值；width 弹窗宽度；style 仅允许白名单 key。子应用调用示例：openModal('标题', '内容', { theme: 'dark', width: '520px', className: 'sub-modal-remote1' })。这样「样式定义在主应用、样式参数来自子应用」，主应用可控，子应用又能按约定定制弹窗外观。

## 参考

- [无界官方文档](https://wujie-micro.github.io/doc/)
- [wujie-vue3](https://wujie-micro.github.io/doc/pack/)
