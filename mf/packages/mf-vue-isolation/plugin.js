import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PLUGIN_NAME = 'ModuleFederationComponentPlugin'

/**
 * 模块联邦组件样式隔离插件：为被 expose 的 Vue/JS 模块打标（?mf），
 * 并注入 mf-vue-section-loader，将模板/渲染根节点包裹在 section[class=wrapperClassName] 中，
 * 配合 CSS 的 postcss-selector-namespace 实现样式隔离。
 */
class ModuleFederationComponentPlugin {
  constructor(options = {}) {
    this.wrapperClassName = options.wrapperClassName || 'mf-container'
    this.processedModules = []
    this.moduleFederation = []
    this.moduleFederationExposesJS = new Set()
    this.moduleFederationExposesVue = new Set()
  }

  isJsModule(module) {
    if (typeof module === 'string') return module.endsWith('.js')
    return (
      module.type === 'javascript/auto' ||
      module.type === 'javascript/esm' ||
      module.type === 'javascript/dynamic' ||
      (module.resource && module.resource.endsWith('.js'))
    )
  }

  isVueModule(module) {
    if (typeof module === 'string') return module.endsWith('.vue')
    return module.type === 'vue' || (module.resource && module.resource.endsWith('.vue'))
  }

  collectModule(module) {
    if (this.isJsModule(module)) this.moduleFederationExposesJS.add(module)
    if (this.isVueModule(module)) this.moduleFederationExposesVue.add(module)
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.buildModule.tap(PLUGIN_NAME, (module) => {
        if (!!module._exposes) {
          this.moduleFederation.push(module)
        } else if (this.moduleFederation.includes(module.issuer)) {
          this.collectModule(module)
        } else if (
          module.issuer &&
          (this.moduleFederationExposesJS.has(module.issuer) ||
            this.moduleFederationExposesVue.has(module.issuer))
        ) {
          this.collectModule(module)
        }
      })
    })

    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {
      nmf.hooks.beforeResolve.tapAsync(PLUGIN_NAME, (resolveData, next) => {
        const parentModule = resolveData.dependencies[0]?._parentModule
        if (
          (parentModule &&
            (this.moduleFederationExposesJS.has(parentModule) ||
              this.moduleFederationExposesVue.has(parentModule))) ||
          this.moduleFederation.includes(parentModule)
        ) {
          const request = resolveData.request
          // 不处理 node_modules、绝对路径、webpack 内部、external
          if (
            request.includes('node_modules') ||
            path.isAbsolute(request) ||
            request.startsWith('webpack://') ||
            request.startsWith('external ')
          ) {
            return next()
          }
          // 不处理裸说明符（npm 包），如 core-js/modules/xxx、vue、lodash/get，避免解析失败
          const isBareSpecifier = !request.startsWith('.') && !request.startsWith('..') && !request.startsWith('/')
          if (isBareSpecifier) {
            return next()
          }
          if (this.isJsModule(request)) {
            resolveData.request += '?mf'
            this.processedModules.push(request)
          } else if (this.isVueModule(request)) {
            resolveData.request += '?mf'
            this.processedModules.push(request)
          }
        }
        next()
      })
    })

    compiler.hooks.afterResolvers.tap(PLUGIN_NAME, (compiler) => {
      const loaderPath = path.resolve(__dirname, 'loader.js')
      compiler.options.module.rules.push({
        test: /\.vue$/,
        resourceQuery: /mf/,
        use: {
          loader: loaderPath,
          options: { wrapperClassName: this.wrapperClassName },
        },
        enforce: 'pre',
      })
    })

    compiler.hooks.done.tap(PLUGIN_NAME, (stats) => {
      const state = JSON.stringify(
        {
          processedModules: this.processedModules,
          moduleFederation: Array.from(this.moduleFederationExposesJS).map((m) => ({
            resource: m.resource,
            id: m.debugId,
          })),
          moduleFederationExposesComponents: Array.from(this.moduleFederationExposesVue).map(
            (m) => ({ resource: m.resource, id: m.debugId })
          ),
        },
        null,
        2
      )
      stats.compilation.compiler.outputFileSystem.writeFileSync(
        path.resolve(
          stats.compilation.compiler.outputPath,
          'module-federation-component-plugin.json'
        ),
        state
      )
    })
  }
}

export default ModuleFederationComponentPlugin
