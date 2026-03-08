# 主包 (Host) 与子应用代码包含关系分析

基于 **standard-mf** 分支的 `pnpm build` 产物分析。

## 1. 构建产物一览

| 应用    | 产物 | 说明 |
|---------|------|------|
| host    | `main.[hash].js` | 主包：入口 + 路由 + 首页 + **remote 加载运行时** |
| host    | `320.[hash].js`  | 异步 chunk：About 页（本地组件） |
| remote1 | `remoteEntry.js` | 子应用 1 容器：PageA、PageB、Widget 等实际代码 |
| remote2 | `remoteEntry.js` | 子应用 2 容器：Dashboard 等实际代码 |

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

| 不包含的内容 | 所在位置 |
|-------------|----------|
| PageA / PageB / Widget 的 Vue 组件与业务逻辑 | remote1 的 `remoteEntry.js`（或它异步拉取的 chunk） |
| Dashboard 的 Vue 组件与业务逻辑 | remote2 的 `remoteEntry.js`（或它异步拉取的 chunk） |
| 子应用的依赖（如子应用自己的 node_modules） | 各自 remote 的 bundle |

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

| 项目 | standard-mf（本分支） | main（loadScript） |
|------|----------------------|----------------------|
| 主包里的 remote 相关代码 | remote 占位 + 运行时 + **remoteEntry URL** | 无 remote 占位；只有通用 `loadScript` + `getRemoteComponent`，**无** remote 名/URL 写死在主包（可完全从 REMOTE_APPS 等运行时配置读取） |
| 子应用业务代码所在 | 始终在 remote 的 remoteEntry | 同左 |
| Remote URL | 写在 webpack `remotes`，打进 main.js | 不打进主包，可运行时配置 |

若要「主包完全不包含任何子应用 URL/名称」，需使用 main 分支的 loadScript 方案；若可接受主包内带 remote 的 URL 和占位逻辑，则 standard-mf 即可，且能享受标准 MF 的按需加载与类型声明（如 `remotes.d.ts`）。

---

## 6. 主包「零引用」是不是必要？实际优势在哪？

**结论：零引用不是必要能力**，只是多了一种架构选择。是否值得做，取决于你是否需要下面这些能力。

### 子应用独立发包：两种方案都支持

**标准 MF 同样支持子应用独立构建、独立部署**：remote1/remote2 各自打自己的包、发自己的版，主应用不用跟着发。子应用发新版本时，主应用无需重新构建或发版，只要 remote 的 shared 约定兼容即可。  
零引用**没有**在「子应用能否独立发包」上多出能力，两者在这点上一致。

### 零引用多出来的实际优势（相对标准 MF）

| 优势 | 说明 |
|------|------|
| **Remote URL 完全运行时配置** | 主包不打进任何子应用地址，所有 remote 的 URL 可从接口、配置中心、环境变量下发，换域名/多环境不用改主包或重新发版。标准 MF 的 URL 写在 webpack `remotes` 里，改 URL 通常要重新构建主应用。 |
| **主应用不改代码/不重建即可增删子应用** | 主包不依赖「有哪些 remote、叫什么名」的构建时信息，新增/下线子应用只改配置（如 REMOTE_APPS），主应用代码和构建产物可以不变。标准 MF 新增子应用通常要在 host 里加 `import('remote3/...')` 和 remotes 配置并重新构建。 |
| **合规与权限** | 主包不暴露子应用域名或入口，某些安全/合规场景下更易满足「主应用不携带未授权目标」的要求。 |
| **主包体积与「认知」** | 主包少几十到几百 byte 的 remote 占位和 URL；体积差异很小，更多是「主应用不依赖子应用清单」的架构清晰度。 |

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
  - remote2：`modules by path .../lodash@4.17.23/.../lodash/*.js 1.39 KiB 3 modules`（sum、identity、_baseSum）
- **单例** 只在**运行时**生效：当 host 与多个 remote 同时加载时，MF 运行时保证只使用**一份** lodash 实例，避免多份副本同时执行带来的状态/版本问题。单例**不会**在构建阶段把 lodash 从子应用 bundle 里剔除。
- 因此：若希望「lodash 只打一份、其它应用不重复打包」，需要在架构上让 **某一方（通常是 host）** 作为 lodash 的提供方，并让子应用在构建时**不**把 lodash 打进自己的包（例如通过 `shared.lodash.import: false` 或 externals 等方式，具体取决于所用 MF 版本和构建配置）；仅配置 `singleton: true` 不会自动去掉各应用 bundle 里的 lodash 代码。

### 子应用不打包 lodash 时，独立运行会怎样？

**会受影响**。若子应用构建时不把 lodash 打进自己的包（完全依赖 shared 从 host 获取），则子应用在**独立运行**时（直接访问子应用自己的 URL，无 host）没有谁往 share scope 里 provide lodash，子应用会拿不到依赖，报错或功能异常。

若既要**集成时单例**又要**子应用能独立运行**，应保留当前做法：子应用构建时**仍然**把 lodash 打进自己的包作为 **fallback**。这样在 host 里一起跑时用共享的那一份，单独跑子应用时用自己 bundle 里的 fallback，两不误。

### 业界最佳实践（shared 与子应用独立运行）

综合 Module Federation 官方文档与社区（如 [module-federation-examples#2219](https://github.com/module-federation/module-federation-examples/issues/2219)）的讨论，常见做法如下。

| 维度 | 建议 |
|------|------|
| **是否让子应用不打包 shared？** | **一般不推荐**。子应用需要**独立运行**（单独打开子应用 URL、本地调试、被不同 host 接入）时，必须能在「无 host 提供 shared」时自给自足，因此应保留 **fallback**（即子应用构建时仍把该依赖打进自己的包）。只有确定子应用**永远不会独立运行**、且始终由同一 shell 先加载时，才考虑在 remote 上使用 `import: false` 不打包。 |
| **shared 放什么？** | **按需配置，不要无脑 share 所有 package.json 依赖**。优先放：(1) **必须单例的**：Vue/React、Vue Router/React Router、Pinia/Redux、i18n 等有全局状态或上下文的；(2) **体积大且多应用共用的**：如 lodash、axios、大型 UI 库。注意：shared 的模块**无法被 tree-shake**，全量 share 大库可能反而增大首包。 |
| **单例与版本** | 对必须单例的依赖使用 `singleton: true`，并用 `requiredVersion` 约束版本范围（如 `^4.17.21`），保证各应用版本兼容；运行时取满足要求的同一份实例。 |
| **集成 vs 独立运行** | **主流做法**：各应用都声明同一 shared 配置（含 `requiredVersion`），且**不**设置 `import: false`，这样每个应用 bundle 里都有一份 fallback。集成时 MF 运行时用 share scope 里那一份（单例）；子应用独立运行时用自己 bundle 里的 fallback。用「重复打包一点体积」换「集成 + 独立运行都可用」。 |
| **加载策略（MF 2.0）** | `shareStrategy: 'version-first'` 严格按版本、初始化时加载所有 remote 的 entry 做版本协商，适合版本要求严的场景；`'loaded-first'` 按需复用已加载的 shared，容错更好（某个 remote 离线不会拖垮整站初始化），可按需选用。 |

**一句话**：需要子应用既能被 host 集成又能独立运行时，**保留 fallback（各应用都打包一份）是业界普遍做法**；只有在「子应用绝不独立运行」的前提下，才考虑让子应用不打包、完全依赖 host 提供。
