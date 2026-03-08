<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="widget">
    <h3>{{ title ?? 'Widget' }}</h3>
    <slot />
  </div>
</template>

<style scoped>
.widget {
  padding: 0.75rem;
  background: #e8f5e9;
  border-radius: 6px;
  border: 1px solid #a5d6a7;
}
.widget h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}
</style>
