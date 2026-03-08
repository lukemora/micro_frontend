<script setup lang="ts">
/**
 * 通过 Bridge 加载 React 子应用 remote3（应用级）。
 * 使用 @module-federation/bridge-vue3 的 createRemoteAppComponent，
 * 与 getRemoteComponent 配合：先按需加载 remoteEntry，再取 export-app 的 Bridge 工厂并挂载到 DOM。
 */
import * as bridge from '@module-federation/bridge-vue3'
import { getRemoteComponent } from '../framework/micro'

const Remote3App = bridge.createRemoteAppComponent({
  loader: () => getRemoteComponent('remote3', './export-app'),
  rootAttrs: { class: 'remote3-root' },
})
</script>

<template>
  <div class="remote3-wrapper">
    <Remote3App basename="/remote3" />
  </div>
</template>

<style scoped>
.remote3-wrapper {
  min-height: 40vh;
}
</style>
