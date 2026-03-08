# 跨应用共享：组件、状态、路由与数据层

在 Vue Host + Vue/React 子应用（含 Bridge 异构）场景下，如何在 Host 与各子应用之间共享**组件**、**状态**（Pinia / Zustand）、**路由**以及**数据层**（axios / React Query）的说明与推荐做法。

---

## 1. 总体原则

- **框架相关**的运行时（Vue 组件、Pinia、Vue Router、React 组件、Zustand、React Router）**不能**跨框架直接复用，只能通过「**契约 + 桥接**」间接协作。
- 可共享的是：**与框架无关**的模块——纯 TS/JS 的**状态桥**、**API 客户端**、**导航函数**、**类型与常量**。
- 推荐：**Host 作为能力提供方**，通过 Module Federation 的 `exposes` 暴露「状态桥、API、导航」等；Vue 子应用继续用 Pinia/Vue Router，React 子应用用 Zustand/React Query/React Router，但**数据与行为**统一来自 Host 暴露的模块。

---

## 2. 组件跨框架复用

| 场景 | 可行性 | 做法 |
|------|--------|------|
| Vue 子应用用 Host 的 Vue 组件 | ✅ 高 | Host 与子应用同属 Vue，shared 同一份 vue；Host 通过 `exposes` 暴露组件，子应用 `import('host/XXX')` 使用。 |
| React 子应用用 Host 的 Vue 组件 | ❌ 不可直接 | 需「桥」：用 Web Components 或 Host 提供「在指定 DOM 上挂载 Vue 组件」的 API，React 侧只持有一个容器 div。复杂度高，一般不推荐。 |
| Host/Vue 子应用用 React 子应用的组件 | ❌ 不可直接 | 同构于上；若必须用，可把 React 组件包成 Web Component，或通过 Bridge 以**应用级**嵌入（当前 remote3 做法）。 |
| **推荐** | - | **组件不跨框架复用**；各应用各自维护 UI，通过**共享状态、API、路由**协同。 |

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

| 模块 | 路径 | 说明 |
|------|------|------|
| `./store` | `src/store/index.ts` | Pinia store（Vue 子应用用） |
| `./sharedStateBridge` | `src/shared/stateBridge.ts` | getState / setState / subscribe，与 Pinia 双向同步 |
| `./api` | `src/api/client.ts` | getList、getUser 等（fetch，与框架无关） |
| `./navigate` | `src/shared/navigate.ts` | navigate(path)，驱动 Host Vue Router |

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
