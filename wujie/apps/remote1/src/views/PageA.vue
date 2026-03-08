<script setup lang="ts">
import { useHostStore } from '@/composables/useHostStore'
import { useRemote1Store } from '@/composables/useRemote1Store'
import { useGlobalModal } from '@/composables/useGlobalModal'

const { count, userName, ready, increment, setUserName } = useHostStore()
const { localCount, message } = useRemote1Store()
const { openModal } = useGlobalModal()
</script>

<template>
  <div class="page-a">
    <h2>Remote1 - Page A（Wujie 子应用）</h2>
    <p class="desc">子应用 remote1，由主应用通过 Wujie 以 URL 方式加载，运行在 iframe 中。下方使用 Host 的 Pinia（通过 bus 同步）并上报本应用状态。</p>
    <div class="card">
      <span class="card-title">卡片内容</span>
    </div>

    <section v-if="ready" class="demo-section">
      <h3>Host Pinia（通过 bus 同步，子应用读写）</h3>
      <p>count: {{ count }}，userName: {{ userName }}</p>
      <button type="button" @click="increment">count +1</button>
      <button type="button" @click="setUserName('Remote1 改名的用户')">改 userName</button>
    </section>

    <section class="demo-section">
      <h3>Remote1 本地状态（上报给 Host 展示）</h3>
      <p>localCount: {{ localCount }}</p>
      <button type="button" @click="localCount++">localCount +1</button>
    </section>

    <section class="demo-section">
      <h3>全局弹窗（由 Host 渲染，子应用可传样式）</h3>
      <button type="button" @click="openModal('来自 Remote1', '默认样式。')">
        默认弹窗
      </button>
      <button type="button" @click="openModal('Remote1 深色主题', '通过 styleOptions.theme: \'dark\' 由主应用应用深色主题。', { theme: 'dark' })">
        深色主题弹窗
      </button>
      <button type="button" @click="openModal('Remote1 自定义样式', '通过 styleOptions 传 className（sub-modal-remote1）、width。主应用白名单后应用。', { className: 'sub-modal-remote1', width: '520px' })">
        子应用样式弹窗
      </button>
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
