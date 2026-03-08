# Vue 3 + Monorepo + Webpack Module Federation Demo

基于 **Webpack 5 Module Federation** 的 Vue 3 微前端 demo：主应用 + 多子应用、多子路由、子应用暴露组件、**标准 MF 按需加载**（路由级 `import('remoteX/...')`）、**CSS 样式隔离**。

> 本分支为 **standard-mf**：使用 Webpack 标准 `remotes` + 动态 `import('remote1/PageA')`。  
> 主包零引用 + 运行时 URL 方案见 **main** 分支（loadScript + getRemoteComponent）。

## 结构说明

- **apps/host**：主应用，Vue 3 + Vue Router；子应用路由使用标准 MF 动态 import：`component: () => import('remote1/PageA')`，首次进入该路由时 Webpack 按需加载对应 remote 的 remoteEntry。
- **apps/remote1**：子应用 1，暴露 `PageA`、`PageB`、`Widget`；使用 `ModuleFederationComponentPlugin` + `mf-vue-section-loader` 做根节点包裹，配合 `postcss-selector-namespace` 对暴露组件的 CSS 做 `.remote1-mf` 命名空间隔离。
- **apps/remote2**：子应用 2，暴露 `Dashboard`；同样使用插件/loader + `.remote2-mf` 命名空间做样式隔离。
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
- 方案与业界对比、优缺点说明见 [docs/CSS-ISOLATION.md](docs/CSS-ISOLATION.md)。

## 如何运行

```bash
# 安装依赖（根目录）
pnpm install

# 同时启动 host + remote1 + remote2（推荐）
pnpm dev

# 或分别启动
pnpm dev:host    # http://localhost:3000
pnpm dev:remote1 # http://localhost:3001
pnpm dev:remote2 # http://localhost:3002
```

1. 打开 http://localhost:3000（主应用）。
2. 点击「Remote1 PageA」或「Remote1 PageB」：此时才会请求 `http://localhost:3001/remoteEntry.js`。
3. 点击「Remote2 Dashboard」：此时才会请求 `http://localhost:3002/remoteEntry.js`。
4. 仅访问首页或 About 时，不会加载任何子应用 remoteEntry。

## 构建

```bash
pnpm build        # 构建所有应用
pnpm build:host
pnpm build:remote1
pnpm build:remote2
```

生产环境需将 **host** 的 `webpack.config.js` 中 `remotes` 的 URL 改为实际部署的 remoteEntry 地址（或 CDN）。
