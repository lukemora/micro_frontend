<script setup lang="ts">
import { ref, watch, computed, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { getRemoteComponent } from '../framework/micro'

const route = useRoute()
const remoteComponent = ref<Component | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)

const remoteName = computed(() => (route.meta.remote as string) ?? '')
const moduleName = computed(() => (route.meta.module as string) ?? '')

async function loadRemote() {
  if (!remoteName.value || !moduleName.value) {
    error.value = '缺少 meta.remote 或 meta.module'
    remoteComponent.value = null
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  remoteComponent.value = null
  try {
    const module = await getRemoteComponent(remoteName.value, moduleName.value)
    remoteComponent.value = (module?.default as Component) ?? null
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

// 路由变化时重新加载对应远程组件（含首次进入）
watch([remoteName, moduleName], loadRemote, { immediate: true })
</script>

<template>
  <div class="remote-view-wrapper">
    <div v-if="loading" class="loading">加载子应用中…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <component v-else-if="remoteComponent" :is="remoteComponent" />
  </div>
</template>

<style scoped>
.remote-view-wrapper {
  min-height: 40vh;
}
.loading,
.error {
  padding: 1.5rem;
  text-align: center;
}
.error {
  color: #c00;
}
</style>
