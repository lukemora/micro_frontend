<script setup lang="ts">
import { computed } from 'vue'
import sum from 'lodash/sum'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from 'host/store'
import { ElButton } from 'element-plus'

const total = sum([1, 2, 3, 4, 5])

// 使用 Host 的 vue-router（shared）
const route = useRoute()
const router = useRouter()
const routeName = computed(() => route.name ?? '-')

function goToRemote1PageB() {
  router.push('/remote1/page-b')
}

// 使用 Host 的 Pinia store（shared + host 暴露 store）
const appStore = useAppStore()
const count = computed(() => appStore.count)
function increment() {
  appStore.increment()
}
</script>

<template>
  <div class="dashboard">
    <h2>Remote2 - Dashboard</h2>
    <p class="intro">子应用 remote2 暴露的仪表盘，使用 .remote2-mf 命名空间做样式隔离。</p>
    <p class="lodash-demo">[Remote2] lodash.sum([1,2,3,4,5]) = {{ total }}</p>
    <p class="version-demo">
      版本冲突演示：此处使用 element-plus 的 ElButton（Remote2 声明 2.2.0，Host 为 ^2.4.0，根 overrides 会拉齐版本）。
    </p>
    <div class="stats">
      <div class="stat-item">统计 A</div>
      <div class="stat-item">统计 B</div>
      <ElButton type="primary">Element Plus 按钮</ElButton>
    </div>

    <section class="demo-section">
      <h3>Vue Router（来自 Host shared）</h3>
      <p>当前路由 name: <code>{{ routeName }}</code></p>
      <button type="button" @click="goToRemote1PageB">跳转 Remote1 PageB</button>
    </section>

    <section class="demo-section">
      <h3>Pinia（来自 Host shared）</h3>
      <p>全局 count: {{ count }}</p>
      <button type="button" @click="increment">count +1</button>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 1rem;
  max-width: 560px;
}
.intro {
  color: #666;
  margin-bottom: 1rem;
}
.stats {
  display: flex;
  gap: 1rem;
}
.stat-item {
  flex: 1;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 8px;
  border: 1px solid #90caf9;
  text-align: center;
}
.demo-section {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #90caf9;
  border-radius: 8px;
  background: #e3f2fd;
}
.demo-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}
.demo-section code {
  background: #bbdefb;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
.demo-section button {
  margin-top: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}
</style>
