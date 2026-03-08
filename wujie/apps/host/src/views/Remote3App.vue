<script setup lang="ts">
/**
 * Wujie 加载 React 子应用：同样通过 URL 加载整页，子应用在 iframe 中独立运行。
 */
import { REMOTE3_BASE } from '@/constants/remote'
</script>

<template>
  <div class="remote-wrapper">
    <WujieVue
      width="100%"
      height="100%"
      name="remote3"
      :url="REMOTE3_BASE"
      :alive="true"
    />
  </div>
</template>

<style scoped>
.remote-wrapper {
  min-height: 50vh;
}
</style>
