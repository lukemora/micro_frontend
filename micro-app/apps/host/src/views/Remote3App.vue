<script setup lang="ts">
import { REMOTE3_BASE } from '@/constants/remote'
import { useSubAppState } from '@/composables/useSubAppState'

const { handleDatachange } = useSubAppState()
const remote3Url = `${REMOTE3_BASE}/`

function onDatachange(e: CustomEvent<{ data: Record<string, unknown> }>) {
  handleDatachange('remote3', e.detail?.data ?? {})
}
</script>

<template>
  <div class="remote-wrapper">
    <micro-app
      name="remote3"
      :url="remote3Url"
      @datachange="onDatachange"
    />
  </div>
</template>

<style scoped>
.remote-wrapper {
  min-height: 50vh;
}
</style>
