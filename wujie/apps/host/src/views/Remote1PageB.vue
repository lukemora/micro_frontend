<script setup lang="ts">
import { REMOTE1_BASE } from '@/constants/remote'

const remote1PageBUrl = `${REMOTE1_BASE}/page-b`
</script>

<template>
  <div class="remote-wrapper">
    <WujieVue
      width="100%"
      height="100%"
      name="remote1-page-b"
      :url="remote1PageBUrl"
      :alive="true"
    />
  </div>
</template>

<style scoped>
.remote-wrapper {
  min-height: 50vh;
}
</style>
