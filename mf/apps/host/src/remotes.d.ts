/**
 * 标准 MF 分支：声明 remote 模块，供 import('remote1/PageA') 等使用。
 */
declare module 'remote1/PageA' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, {}>
  export default component
}
declare module 'remote1/PageB' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, {}>
  export default component
}
declare module 'remote2/Dashboard' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, {}>
  export default component
}
