<script setup lang="ts">
import { REMOTE2_BASE } from '@/constants/remote'
import { useSubAppState } from '@/composables/useSubAppState'

const { handleDatachange } = useSubAppState()
const remote2Url = `${REMOTE2_BASE}/`
const defaultPage = '/dashboard'

function onDatachange(e: CustomEvent<{ data: Record<string, unknown> }>) {
  handleDatachange('remote2', e.detail?.data ?? {})
}
</script>

<template>
  <div class="remote-wrapper">
    <micro-app
      name="remote2-dashboard"
      :url="remote2Url"
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
