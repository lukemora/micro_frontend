import React from 'react'
import App from './App'
import { createBridgeComponent } from '@module-federation/bridge-react'

/**
 * Bridge 导出：将 React 应用包装为可被任意 Host（如 Vue）按「应用级」加载的远程模块。
 * 契约：default 为工厂函数，返回 { render(dom), destroy(dom) }。
 */
export default createBridgeComponent({
  rootComponent: App,
})
