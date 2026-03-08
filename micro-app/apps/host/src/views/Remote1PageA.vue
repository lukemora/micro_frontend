<script setup lang="ts">
/**
 * Micro-App 通过「子应用 index.html URL」加载；default-page 指定子应用内页面。
 * @datachange 接收子应用 dispatch 的数据（Host Pinia 的 action 或子应用状态上报）。
 */
import { REMOTE1_BASE } from '@/constants/remote'
import { useSubAppState } from '@/composables/useSubAppState'

const { handleDatachange } = useSubAppState()
const remote1Url = `${REMOTE1_BASE}/`
const defaultPage = '/page-a'

function onDatachange(e: CustomEvent<{ data: Record<string, unknown> }>) {
  handleDatachange('remote1', e.detail?.data ?? {})
}
</script>

<template>
  <div class="remote-wrapper">
    <micro-app
      name="remote1-page-a"
      :url="remote1Url"
      :default-page="defaultPage"
      @datachange="onDatachange"
    />
  </div>
</template>

<style scoped>
.remote-wrapper {
  min-height: 50vh;
}
</style>
