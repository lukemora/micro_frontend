<script setup lang="ts">
import { useHostStore } from '@/composables/useHostStore'
import { useRemote2Store } from '@/composables/useRemote2Store'
import { useGlobalModal } from '@/composables/useGlobalModal'

const { count, userName, ready, increment, setUserName } = useHostStore()
const { statsClicks, message } = useRemote2Store()
const { openModal } = useGlobalModal()
</script>

<template>
  <div class="dashboard">
    <h2>Remote2 - Dashboard（Wujie 子应用）</h2>
    <p class="intro">子应用 remote2 的仪表盘，通过 Wujie 以 URL 加载。下方使用 Host Pinia 并上报本应用状态。</p>
    <div class="stats">
      <div class="stat-item">统计 A</div>
      <div class="stat-item">统计 B</div>
    </div>

    <section v-if="ready" class="demo-section">
      <h3>Host Pinia（通过 bus 同步）</h3>
      <p>count: {{ count }}，userName: {{ userName }}</p>
      <button type="button" @click="increment">count +1</button>
      <button type="button" @click="setUserName('Remote2 改名的用户')">改 userName</button>
    </section>

    <section class="demo-section">
      <h3>Remote2 本地状态（上报给 Host 展示）</h3>
      <p>statsClicks: {{ statsClicks }}</p>
      <button type="button" @click="statsClicks++">statsClicks +1</button>
    </section>

    <section class="demo-section">
      <h3>全局弹窗（可传 styleOptions 定制样式）</h3>
      <button type="button" @click="openModal('来自 Remote2', '默认弹窗。')">
        默认弹窗
      </button>
      <button type="button" @click="openModal('Remote2 蓝色主题', '使用主应用预置的 sub-modal-remote2 样式。', { className: 'sub-modal-remote2', width: '90vw' })">
        子应用样式弹窗
      </button>
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
.dashboard :deep(h2) {
  margin-top: 0;
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
.demo-section button {
  margin-right: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}
</style>
