<script setup lang="ts">
import { REMOTE1_BASE } from '@/constants/remote'
import { useSubAppState } from '@/composables/useSubAppState'

const { handleDatachange } = useSubAppState()
const remote1Url = `${REMOTE1_BASE}/`
const defaultPage = '/page-b'

function onDatachange(e: CustomEvent<{ data: Record<string, unknown> }>) {
  handleDatachange('remote1', e.detail?.data ?? {})
}
</script>

<template>
  <div class="remote-wrapper">
    <micro-app
      name="remote1-page-b"
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
