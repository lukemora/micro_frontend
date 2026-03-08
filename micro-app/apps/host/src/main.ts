import { createApp } from 'vue'
import { createPinia } from 'pinia'
import microApp from '@micro-zoe/micro-app'
import App from './App.vue'
import router from './router'
import { setupHostStoreSync } from './composables/useSubAppState'

microApp.start({
  // Vite 子应用使用 type="module" 的 script，默认 with 沙箱会报 "Cannot use import outside a module"，故使用 iframe 沙箱
  iframe: true,
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
setupHostStoreSync()
app.mount('#app')
