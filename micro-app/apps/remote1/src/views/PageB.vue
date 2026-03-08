<script setup lang="ts">
import { useHostStore } from '@/composables/useHostStore'
import { useRemote1Store } from '@/composables/useRemote1Store'

const { count, userName, ready, increment, setUserName } = useHostStore()
const { localCount } = useRemote1Store()
</script>

<template>
  <div class="page-b">
    <h2>Remote1 - Page B（Micro-App 子应用）</h2>
    <p>同一子应用的另一页面，同样可读写 Host Pinia 并上报本地状态。</p>
    <section v-if="ready" class="demo-section">
      <h3>Host Pinia</h3>
      <p>count: {{ count }}，userName: {{ userName }}</p>
      <button type="button" @click="increment">count +1</button>
      <button type="button" @click="setUserName('PageB 改名的用户')">改 userName</button>
    </section>
    <section class="demo-section">
      <h3>Remote1 本地状态（上报给 Host）</h3>
      <p>localCount: {{ localCount }}</p>
      <button type="button" @click="localCount++">localCount +1</button>
    </section>
    <ul class="list">
      <li>列表项 1</li>
      <li>列表项 2</li>
    </ul>
  </div>
</template>

<style scoped>
.page-b {
  padding: 1rem;
}
.list {
  list-style: none;
  padding-left: 0;
}
.list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
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
