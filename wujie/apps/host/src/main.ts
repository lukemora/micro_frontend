import { createApp } from 'vue'
import { createPinia } from 'pinia'
import WujieVue from 'wujie-vue3'
import App from './App.vue'
import router from './router'
import { setupHostStoreSync } from './bus'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(WujieVue)
setupHostStoreSync()
app.mount('#app')
