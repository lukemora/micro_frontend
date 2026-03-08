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

会并行启动：

- **Host**：http://localhost:5000
- **Remote1**：http://localhost:5001
- **Remote2**：http://localhost:5002
- **Remote3**：http://localhost:5003

浏览器访问 **http://localhost:5000**，通过主导航切换「首页 / About / 样式隔离 / Remote1 PageA·PageB / Remote2 Dashboard / Remote3」。

也可单独启动：

```bash
pnpm dev:host
pnpm dev:remote1
pnpm dev:remote2
pnpm dev:remote3
```

## 三种微前端方案对比

| 维度           | Module Federation (mf)     | Wujie 无界              | Micro-App（本 demo）	         |
|----------------|----------------------------|--------------------------|----------------------------------|
| **加载方式**   | 远程模块 remoteEntry + 按需 import 组件/页面 | 子应用 URL，iframe 运行 | 子应用 URL，CustomElement + Shadow DOM 沙箱 |
| **子应用形态** | 暴露若干模块（如 PageA、Dashboard） | 独立 SPA，整页加载       | 独立 SPA，整页 HTML 被解析注入   |
| **技术栈**     | Webpack + ModuleFederationPlugin | Vite，无 MF 配置        | Vite，主应用 @micro-zoe/micro-app |
| **样式/脚本隔离** | 同文档，依赖 CSS 命名空间等 | iframe 天然隔离         | Shadow DOM + 沙箱隔离            |
| **主应用集成** | `import('remote1/PageA')`  | `<WujieVue name="xxx" :url="url" />` | `<micro-app name="xxx" url="..." />` |
| **子应用改造** | 需 exposes、shared、独立运行入口 | 可零改造，需 CORS       | 仅需 CORS，可选 baseroute        |

## 目录结构

```
micro-app/
├── apps/
│   ├── host/          # 主应用 Vue3 + Vite + @micro-zoe/micro-app
│   ├── remote1/       # 子应用 Vue3，路由 /page-a、/page-b
│   ├── remote2/       # 子应用 Vue3，路由 /dashboard
│   └── remote3/       # 子应用 React，单页
├── docs/
│   └── STYLE-ISOLATION.md   # 样式隔离方案说明
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 关键实现要点

1. **主应用 (host)**  
   - 安装 `@micro-zoe/micro-app`，在 `main.ts` 中执行 `microApp.start()`。  
   - Vue 3 需在 Vite 的 vue 插件中配置 `compilerOptions.isCustomElement: (tag) => tag === 'micro-app'`，否则会报未知自定义元素。  
   - 各子应用页面对应一个路由组件，组件内使用 `<micro-app name="唯一名" :url="子应用 index.html 地址" default-page="子应用内路径" />`，例如 remote1 PageA 的 url 为 `http://localhost:5001/`，default-page 为 `/page-a`。  
   - **Vite 子应用**需使用 **iframe 沙箱**：因 Vite 入口为 `<script type="module">`，默认 with 沙箱会报 “Cannot use import statement outside a module”。本 demo 在 `main.ts` 中已配置 `microApp.start({ iframe: true })`。

2. **子应用 (remote1/2/3)**  
   - 普通 Vite 项目，配置 `server.port` 与 `server.cors: true`（或 `headers['Access-Control-Allow-Origin'] = '*'`）。  
   - 无需强制改造入口；若需与主应用路由一致，可在创建 router 时使用 `window.__MICRO_APP_BASE_ROUTE__ || '/'` 作为 base。

3. **与 mf / wujie 的对比**  
   - MF：主应用和子应用可共享 Vue/Router/Pinia 等运行时。  
   - Wujie：主、子 iframe 隔离，通信靠 props、bus。  
   - Micro-App：主、子在同一文档下的 Shadow DOM 与沙箱中，可依赖数据通信 API（如 `microApp.setData`、子应用 `window.microApp.addDataListener`）做通信。

## 子应用使用 Host 的 Pinia

因 micro-app 下主、子应用 JS 隔离，子应用不能直接 `import('host/store')`。本 demo 通过 **micro-app 数据通信** 同步：

- **主应用**：在 `composables/useSubAppState.ts` 中 `setupHostStoreSync()` 订阅 Pinia，store 变化时对各个子应用 name 调用 `microApp.setData(name, { hostStore: { count, userName } })`；监听各 `<micro-app>` 的 `@datachange`，若 `data.type === 'host:action'` 则执行 store 的 `increment` / `setUserName`。
- **子应用**：在 composable（Vue）或 hook（React）中 `window.microApp.addDataListener((data) => { ... data.hostStore ... }, true)` 更新本地 ref/state；按钮调用 `window.microApp.dispatch({ type: 'host:action', payload: { type, payload } })`。

子应用侧封装：**useHostStore()**（Vue：remote1/2 的 `composables/useHostStore.ts`，React：remote3 的 `hooks/useHostStore.ts`）。

## Host 使用子应用的状态（子应用 Pinia 暴露给主应用）

子应用内部维护自己的状态（如 remote1 的 `localCount`、`message`，remote2 的 `statsClicks`），在变化时通过 **dispatch** 上报：

- **子应用**：`window.microApp.dispatch({ type: 'remote1:store', localCount, message })`（remote2 同理 `remote2:store`）。
- **主应用**：在各子应用对应的 `<micro-app>` 上监听 `@datachange`，在 `useSubAppState()` 的 `handleDatachange` 中解析 `data.type === 'remote1:store'` / `'remote2:store'`，更新 `remote1State` / `remote2State`，在顶部的「子应用状态」面板展示。

这样主应用即可展示各子应用的状态，无需直接访问子应用内部。

## 样式隔离 · Demo 与方案说明

- **演示页**：主应用导航中提供 **「样式隔离」**（路由 `/style-isolation`），包含方案说明摘要、主应用区域与子应用区域的对比演示（iframe 沙箱下两区域样式互不污染），以及与其它微前端方案的对比表。
- **方案说明文档**：[docs/STYLE-ISOLATION.md](docs/STYLE-ISOLATION.md) 说明 Micro-App 的默认 scopecss、`disable-scopecss`、iframe/with 沙箱对样式的影响，以及常见问题与建议、与 qiankun/Wujie/MF 的对比。

要点摘要：
- **默认（scopecss 开启）**：子应用选择器加 `micro-app[name=xxx]` 前缀，防止子应用样式影响主应用；不防止主应用样式影响子应用（with 沙箱时）。
- **iframe 沙箱**（本 demo）：主/子应用分属不同文档，样式天然双向隔离。
- **disable-scopecss**：关闭样式隔离，可提升性能，需避免应用间类名冲突。

## 参考

- [Micro-App 官方文档](https://micro-zoe.github.io/doc/zh/)
- [GitHub @micro-zoe/micro-app](https://github.com/micro-zoe/micro-app)
