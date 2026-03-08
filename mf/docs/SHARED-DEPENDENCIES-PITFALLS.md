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

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ 第 1 步：生成清单（开发/CI 时跑一次）                                    │
  │   pnpm run shared-manifest                                              │
  │   → 脚本扫 apps/host、remote1、remote2、remote3 的 package.json           │
  │   → 只挑“基础库”（vue、vue-router、axios、element-plus 等）               │
  │   → 写出 shared-manifest.json（里面带 usedBy：谁用了谁）                 │
  └─────────────────────────────────────────────────────────────────────────┘
                                        ↓
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ 第 2 步：主应用按清单 provide                                           │
  │   Host 构建时：webpack.config.js 读 shared-manifest.json                 │
  │   → 用 scripts/shared-config-from-manifest.js 转成 webpack 的 shared 配置 │
  │   → 所以 Host 的 shared 完全由 manifest 决定，不手写                     │
  └─────────────────────────────────────────────────────────────────────────┘
                                        ↓
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ 第 3 步：子应用只“用”、不自己 provide                                   │
  │   remote1 / remote2 被 Host 加载时，从 Host 的 shared 作用域里拿依赖     │
  │   → 它们用到的依赖必须在 manifest 的 usedBy 里（因为只有 manifest 里的   │
  │     依赖才会被 Host provide）                                            │
  │   → 约定：子应用不要在 shared 里私自加清单外的依赖，避免版本分裂/幽灵依赖  │
  └─────────────────────────────────────────────────────────────────────────┘
```

- **主应用**：以 shared-manifest.json 为**唯一真相**，统一在 `shared` 里提供这些依赖（本仓库里 Host 的 shared 已从 manifest 生成）。
- **微应用**：只使用这些依赖，不（或尽量不）自己再写一份 shared 清单；缺什么就提需求“把某某库加进 manifest”，由主应用/架构统一加，避免漏配或私自升级。

#### 本仓库里方案 2 的落点

- 脚本：`scripts/generate-shared-manifest.js` 生成 `shared-manifest.json`。
- Host 用清单：`scripts/shared-config-from-manifest.js` 把 manifest 转成 webpack shared；`apps/host/webpack.config.js` 构建时读 manifest，用这份 shared。
- 看“对 remote1 的作用”：manifest 里每个依赖有 `usedBy`；remote1 在 usedBy 里的依赖，就是 remote1 从 Host 拿到的。跑 `pnpm run validate-shared` 会按应用汇总打印，例如「remote1（从 Host 消费）: vue, vue-router, pinia, lodash, axios」。

---

## 本仓库相关文件

| 文件 | 说明 |
|------|------|
| `apps/host/webpack.config.js` | 主应用 shared 配置（vue、vue-router、pinia、lodash、element-plus、axios 等） |
| `apps/remote1/webpack.config.js` | Remote1 shared；axios 使用 `import: false` 演示幽灵依赖 |
| `apps/remote2/webpack.config.js` | Remote2 shared；element-plus 版本与 host 不一致以演示版本冲突 |
| `apps/remote1/src/views/PageB.vue` | 使用 axios 的页面（幽灵依赖演示） |
| `apps/remote2/src/views/Dashboard.vue` | 使用 element-plus 的页面（版本冲突演示） |
| `package.json` | 根 resolutions/overrides 示例（拉齐版本） |
| `scripts/generate-shared-manifest.js` | 生成 shared-manifest.json 的脚本 |
| `scripts/shared-config-from-manifest.js` | 供 Host 读取 manifest 并生成 webpack shared 配置 |
| `scripts/validate-shared-manifest.js` | 展示各 shared 的 usedBy 及「按应用汇总」，用于查看 manifest 对 remote1 等的作用 |

- 运行 `pnpm run shared-manifest` 可重新生成 `shared-manifest.json`；主应用构建时会读取该文件生成 `shared`，故**先改 manifest 再构建**即可生效。
- 运行 `pnpm run validate-shared` 可查看「每个 shared 依赖被谁消费」以及「按应用汇总：remote1 从 manifest 中消费的 shared 依赖」，从而**看到 shared-manifest 对 remote1 的作用**。

### 怎么看 shared-manifest.json 作用到了 remote1

1. **构建链路**：Host 的 `webpack.config.js` 会读取 `shared-manifest.json`，用 `scripts/shared-config-from-manifest.js` 生成 `shared` 配置；因此 manifest 里列出的依赖都会由 Host 统一 provide。remote1 被 Host 加载时，从同一个 shared 作用域里拿这些依赖，所以 **manifest 通过 Host 间接作用到 remote1**。
2. **看 usedBy**：打开 `shared-manifest.json`，每个依赖下有 `usedBy` 数组。例如 `"axios": { "usedBy": ["host", "remote1"] }` 表示 axios 由 host 与 remote1 使用，即 **remote1 会从 Host 获取 axios**。
3. **跑校验脚本**：在 `mf` 目录执行 `pnpm run validate-shared`，会打印每个 shared 的 usedBy，以及按应用汇总「remote1（从 Host 消费）: vue, vue-router, pinia, lodash, axios」，一眼看出 remote1 受 manifest 约束、消费了哪些 shared。
