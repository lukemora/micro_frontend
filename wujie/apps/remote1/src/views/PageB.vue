<script setup lang="ts">
import { useGlobalModal } from '@/composables/useGlobalModal'

const { openModal } = useGlobalModal()
</script>

<template>
  <div class="page-b">
    <h2>Remote1 - Page B（Wujie 子应用）</h2>
    <p>同一子应用的另一页面。</p>
    <ul class="list">
      <li>列表项 1</li>
      <li>列表项 2</li>
    </ul>
    <p>
      <button type="button" class="btn-modal" @click="openModal('来自 PageB', 'PageB 也可通过 bus 打开主应用提供的全局弹窗。')">
        打开全局弹窗
      </button>
    </p>
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
.btn-modal {
  margin-top: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}
</style>
