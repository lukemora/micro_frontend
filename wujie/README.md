# Wujie 无界 微前端 Demo

与同目录下 `mf`（Module Federation）场景一致：**host** 主应用 + **remote1**、**remote2**、**remote3** 子应用，用于对比 Wujie 与 MF 的实现方式。

## 运行方式

```bash
# 在 wujie 目录下
pnpm install
pnpm dev
```

会并行启动：

- **Host**：http://localhost:4000
- **Remote1**：http://localhost:4001
- **Remote2**：http://localhost:4002
- **Remote3**：http://localhost:4003

浏览器访问 **http://localhost:4000**，通过主导航切换「首页 / About / Remote1 PageA·PageB / Remote2 Dashboard / Remote3」。

也可单独启动：

```bash
pnpm dev:host
pnpm dev:remote1
pnpm dev:remote2
pnpm dev:remote3
```

## Wujie 与 MF 的差异

| 维度 | Module Federation (mf) | Wujie 无界 (本 demo) |
|------|------------------------|----------------------|
| **加载方式** | 主应用通过 **远程模块**（remoteEntry + exposes）按需加载「组件/页面」 | 主应用通过 **子应用 URL** 加载整页，子应用在 **iframe** 中运行 |
| **子应用形态** | 打包出 remoteEntry，暴露若干模块（如 `PageA`、`Dashboard`） | 独立 SPA，可单独打开（如 http://localhost:4001/page-a） |
| **技术栈** | 本仓库 mf 使用 Webpack + ModuleFederationPlugin | 本 demo 使用 **Vite**，子应用无需 MF 配置 |
| **样式/脚本隔离** | 同主应用文档，依赖 shared、CSS 命名空间等 | iframe 天然隔离，无需额外处理 |
| **依赖共享** | 通过 `shared` 配置共享 vue、vue-router、pinia 等 | 不共享运行时，主应用与子应用各自依赖；通信可用 **props**、**bus** |
| **主应用集成** | 路由里 `import('remote1/PageA')` 等 | 路由里渲染 `<WujieVue name="xxx" :url="子应用URL" />` |
| **子应用改造** | 需配置 exposes、shared、独立运行入口 | **保活/重建模式** 下子应用可零改造；需 **CORS**（本 demo 已开 Vite `cors: true`） |

## 目录结构

```
wujie/
├── apps/
│   ├── host/          # 主应用 Vue3 + Vite + wujie-vue3
│   ├── remote1/       # 子应用 Vue3，路由 /page-a、/page-b
│   ├── remote2/       # 子应用 Vue3，路由 /dashboard
│   └── remote3/       # 子应用 React，单页
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 关键实现要点

1. **主应用 (host)**  
   - 使用 `wujie-vue3`，在 `main.ts` 中 `app.use(WujieVue)`。  
   - 各子应用页面对应一个路由组件，组件内使用 `<WujieVue name="唯一名" :url="子应用完整 URL" :alive="true" />`，例如 remote1 PageA 的 URL 为 `http://localhost:4001/page-a`。

2. **子应用 (remote1/2/3)**  
   - 普通 Vite 项目，配置 `server.port` 与 `server.cors: true`。  
   - 无需 Wujie 生命周期改造（本 demo 使用保活方式加载）。  
   - 主应用通过「不同 path」加载不同页面（如 remote1 的 `/page-a`、`/page-b`）。

3. **与 mf 的对比**  
   - MF：主应用和子应用**共享** Vue/Router/Pinia，子应用可 `import('host/store')` 等。  
   - Wujie：主、子应用**隔离**，若需通信可使用 [无界 bus](https://wujie-micro.github.io/doc/api/bus.html) 或主应用通过 `props` 向子应用传参。

## 子应用使用 Host 的 Pinia

因 iframe 与主应用 JS 隔离，不能直接 `import('host/store')`。本 demo 通过 **bus 事件** 同步：

- **Host**：在 `bus/index.ts` 中订阅 Pinia，store 变化时 `bus.$emit('host:store', { count, userName })`；监听 `host:action`，根据 `type` 调用 store 的 `increment` / `setUserName`；监听 `host:requestStore`，子应用挂载时请求一次初始状态。
- **子应用**：在 composable（Vue）或 hook（React）中 `bus.$on('host:store', ...)` 更新本地 ref/state，按钮调用 `bus.$emit('host:action', { type, payload })`。

子应用侧封装：`useHostStore()`（Vue：remote1/2 的 `composables/useHostStore.ts`，React：remote3 的 `hooks/useHostStore.ts`）。

## Host 使用子应用的状态（子应用 Pinia 暴露给主应用）

子应用内部维护自己的状态（如 remote1 的 `localCount`、remote2 的 `statsClicks`），在变化时通过 bus 上报：

- 子应用：`bus.$emit('remote1:store', { localCount, message })`（remote2 同理 `remote2:store`）。
- Host：在 `useSubAppState()` 中 `bus.$on('remote1:store', ...)` / `bus.$on('remote2:store', ...)`，将结果展示在顶部的「子应用状态」面板。

这样主应用即可展示各子应用的状态，无需直接访问 iframe 内部。

## 全局弹窗（iframe 方案下的常见痛点）

在 iframe 内写的弹窗只能盖住该 iframe 区域，无法覆盖整个页面。本 demo 的解决方式：

- **弹窗由主应用提供**：在 Host 中挂载 `<GlobalModal />`（`Teleport to="body"`），监听 bus 事件 `global:openModal` / `global:closeModal`。
- **子应用只负责「发起」**：子应用内按钮调用 `bus.$emit('global:openModal', { title, content })`，主应用收到后在 **主文档** 中渲染遮罩和弹窗，因此可覆盖整个视口（含所有 iframe）。

使用方式：在 Remote1 PageA/PageB、Remote2 Dashboard、Remote3 中均有「打开全局弹窗」按钮，点击后弹窗会盖住整页。

### 子应用对弹窗样式的修改

弹窗 DOM 在主应用文档中，子应用无法直接写主应用的 CSS。本 demo 的做法是：**子应用在打开弹窗时通过 payload 传 `styleOptions`，由主应用校验后应用**，既满足定制又避免子应用随意注入样式：

- **协议**：`global:openModal` 的 payload 支持可选字段 `styleOptions: { className?, theme?, width?, style? }`。
- **主应用规则**：
  - `className`：只接受以 `sub-modal-` 为前缀的 class（如 `sub-modal-remote1`），主应用预置对应样式或与子应用约定；避免子应用写全局冲突类名。
  - `theme`：枚举值，如 `'default' | 'dark'`，主应用内置主题样式。
  - `width`：弹窗宽度，如 `'520px'`、`'90vw'`。
  - `style`：仅允许白名单 key（如 `maxWidth`、`borderRadius` 等），主应用过滤后作为内联样式应用到弹窗容器。

子应用调用示例：

```ts
openModal('标题', '内容', {
  theme: 'dark',
  width: '520px',
  className: 'sub-modal-remote1',
})
```

这样「样式定义在主应用、样式参数来自子应用」，主应用可控、可审计，子应用又能按约定定制弹窗外观。Demo 中 Remote1 有「默认 / 深色主题 / 子应用样式」三种按钮，Remote2、Remote3 也有带 `styleOptions` 的示例。

## 参考

- [无界官方文档](https://wujie-micro.github.io/doc/)
- [wujie-vue3](https://wujie-micro.github.io/doc/pack/)
