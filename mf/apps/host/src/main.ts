import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAppStore } from './store'
import { getState, setState as setStateBridge, subscribe as subscribeBridge } from './shared/stateBridge'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

const store = useAppStore()
let updatingFromBridge = false

// Pinia -> 状态桥（供 React 等读取）
store.$subscribe(() => {
  if (!updatingFromBridge) setStateBridge({ count: store.count, userName: store.userName })
})
setStateBridge({ count: store.count, userName: store.userName })

// 状态桥 -> Pinia（React 通过 setState 更新时同步回 Vue）
subscribeBridge(() => {
  updatingFromBridge = true
  const s = getState()
  store.$patch({ count: s.count, userName: s.userName })
  updatingFromBridge = false
})
