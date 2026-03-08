<script setup lang="ts">
/**
 * Wujie 通过「子应用 URL」加载，不是 MF 的远程模块。
 * 子应用在 iframe 中运行，与主应用隔离；可通过 props 传参或 bus 通信。
 */
import { REMOTE1_BASE } from '@/constants/remote'

const remote1PageAUrl = `${REMOTE1_BASE}/page-a`
</script>

<template>
  <div class="remote-wrapper">
    <WujieVue
      width="100%"
      height="100%"
      name="remote1-page-a"
      :url="remote1PageAUrl"
      :alive="true"
    />
  </div>
</template>

<style scoped>
.remote-wrapper {
  min-height: 50vh;
}
</style>
