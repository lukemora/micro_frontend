<script setup lang="ts">
import { useHostStore } from '@/composables/useHostStore'
import { useRemote1Store } from '@/composables/useRemote1Store'

const { count, userName, ready, increment, setUserName } = useHostStore()
const { localCount } = useRemote1Store()
</script>

<template>
  <div class="page-a">
    <h2>Remote1 - Page A（Micro-App 子应用）</h2>
    <p class="desc">子应用 remote1，由主应用通过 Micro-App 以 URL 方式加载。下方使用 Host 的 Pinia（通过 setData/addDataListener 同步）并上报本应用状态给 Host。</p>
    <div class="card">
      <span class="card-title">卡片内容</span>
    </div>

    <section v-if="ready" class="demo-section">
      <h3>Host Pinia（通过 setData 同步，子应用 dispatch host:action 读写）</h3>
      <p>count: {{ count }}，userName: {{ userName }}</p>
      <button type="button" @click="increment">count +1</button>
      <button type="button" @click="setUserName('Remote1 改名的用户')">改 userName</button>
    </section>

    <section class="demo-section">
      <h3>Remote1 本地状态（dispatch remote1:store 上报给 Host 展示）</h3>
      <p>localCount: {{ localCount }}</p>
      <button type="button" @click="localCount++">localCount +1</button>
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
.page-a :deep(h2) {
  margin-top: 0;
  color: #2c3e50;
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
.demo-section button {
  margin-right: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}
</style>
