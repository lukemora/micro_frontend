<script setup lang="ts">
import { REMOTE2_BASE } from '@/constants/remote'

const remote2DashboardUrl = `${REMOTE2_BASE}/dashboard`
</script>

<template>
  <div class="remote-wrapper">
    <WujieVue
      width="100%"
      height="100%"
      name="remote2-dashboard"
      :url="remote2DashboardUrl"
      :alive="true"
    />
  </div>
</template>

<style scoped>
.remote-wrapper {
  min-height: 50vh;
}
</style>
