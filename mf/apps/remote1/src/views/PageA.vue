<script setup lang="ts">
import { computed } from 'vue'
import capitalize from 'lodash/capitalize'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from 'host/store'

const text = capitalize('remote1 page a')

// 使用 Host 的 vue-router（shared）：当前路由信息与编程式导航
const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)

function goHome() {
  router.push('/')
}

// 使用 Host 的 Pinia store（shared + host 暴露 store）：读写同一 store
const appStore = useAppStore()
const count = computed(() => appStore.count)
const userName = computed(() => appStore.userName)
function increment() {
  appStore.increment()
}
function setUserName() {
  appStore.setUserName('Remote1 改名的用户')
}
</script>

<template>
  <div class="page-a">
    <h2>Remote1 - Page A</h2>
    <p class="desc">子应用 remote1 暴露的页面组件，样式通过 .remote1-mf 命名空间隔离。</p>
    <p class="lodash-demo">[Remote1] lodash.capitalize: {{ text }}</p>
    <div class="card">
      <span class="card-title">卡片内容</span>
    </div>

    <section class="demo-section">
      <h3>Vue Router（来自 Host shared）</h3>
      <p>当前路径: <code>{{ currentPath }}</code></p>
      <button type="button" @click="goHome">回首页</button>
    </section>

    <section class="demo-section">
      <h3>Pinia（来自 Host shared，与主应用同一 store）</h3>
      <p>count: {{ count }}，userName: {{ userName }}</p>
      <button type="button" @click="increment">count +1</button>
      <button type="button" @click="setUserName">改 userName</button>
    </section>
  </div>
</template>

<style scoped>
.page-a {
  padding: 1rem;
  max-width: 560px;
}
.desc {
  color: #666;
  margin-bottom: 1rem;
}
.card {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}
.card-title {
  font-weight: 600;
  color: #42b883;
}
.demo-section {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f5f5f5;
}
.demo-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}
.demo-section code {
  background: #e0e0e0;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
.demo-section button {
  margin-right: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}
</style>

<style>
/* 未加 scoped 的样式会被 postcss-selector-namespace 加上 .remote1-mf 前缀，仅影响本组件根 section 内 */
.page-a h2 {
  margin-top: 0;
  color: #2c3e50;
}
</style>
