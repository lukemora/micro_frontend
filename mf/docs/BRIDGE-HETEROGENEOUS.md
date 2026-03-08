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
import App from './App'
import { createBridgeComponent } from '@module-federation/bridge-react'

export default createBridgeComponent({
  rootComponent: App,
})
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
import * as bridge from '@module-federation/bridge-vue3'
import { getRemoteComponent } from '../framework/micro'

const Remote3App = bridge.createRemoteAppComponent({
  loader: () => getRemoteComponent('remote3', 'export-app'),
  rootAttrs: { class: 'remote3-root' },
})
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

| 位置     | 配置说明 |
|----------|----------|
| host `webpack.config.js` | `remotes` 增加 `remote3: 'remote3@http://localhost:3003/remoteEntry.js'` |
| host `framework/micro/index.ts` | `REMOTE_APPS` 增加 remote3 的 `name`、`chunk`、`routePrefix` |
| host `util/remote.ts` | `Window` 类型中增加 `remote3` 的 container 类型（供 loadComponent 使用） |

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
