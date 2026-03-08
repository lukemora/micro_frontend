/**
 * 子应用独立运行时的入口；被 host 消费时仅通过 remoteEntry 暴露的模块加载，不执行此文件。
 */
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
