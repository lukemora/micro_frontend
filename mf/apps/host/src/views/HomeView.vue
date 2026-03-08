<script setup lang="ts">
import { computed } from 'vue'
import get from 'lodash/get'
import { useAppStore } from '../store'
import { useRoute, useRouter } from 'vue-router'

const obj = { a: { b: 'Host 使用 lodash.get' } }
const value = get(obj, 'a.b', '')

// Pinia 使用示例（Host 创建的 store，子应用也会共用）
const appStore = useAppStore()
const count = computed(() => appStore.count)
const userName = computed(() => appStore.userName)
function increment() {
  appStore.increment()
}

// Vue Router 使用示例
const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)
function goToAbout() {
  router.push('/about')
}
</script>

<template>
  <div class="home-view">
    <h1>首页</h1>
    <p>主应用本地页面。访问上方「Remote1 PageA / PageB」或「Remote2 Dashboard」时才会加载对应子应用的 remoteEntry。</p>
    <p class="lodash-demo">[Host] lodash.get 结果: {{ value }}</p>

    <section class="demo-section">
      <h3>Pinia 示例（Host 创建，子应用共用同一 store）</h3>
      <p>count: {{ count }}，userName: {{ userName }}</p>
      <button type="button" @click="increment">count +1</button>
    </section>

    <section class="demo-section">
      <h3>Vue Router 示例</h3>
      <p>当前路径: <code>{{ currentPath }}</code></p>
      <button type="button" @click="goToAbout">跳转 About</button>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 640px;
}
.home-view h1 {
  margin-top: 0;
}
.demo-section {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}
.demo-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}
.demo-section code {
  background: #eee;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
.demo-section button {
  margin-top: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}
</style>
