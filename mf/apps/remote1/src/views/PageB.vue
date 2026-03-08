<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 幽灵依赖演示：axios 由 Host shared 提供（remote1 配置了 import: false）。
// 通过主应用打开此页正常；若单独运行 remote1（不通过 host）会因无提供方报错。
const tip = ref<string>('')
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await axios.get<{ url: string }>('https://httpbin.org/get')
    tip.value = `请求来自 Host 提供的 axios，当前 URL: ${res.data.url || '-'}`
  } catch (e) {
    tip.value = `请求失败（若单独运行 remote1 会在此报错）: ${(e as Error).message}`
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-b">
    <h2>Remote1 - Page B</h2>
    <p>同一子应用的另一页面，共用同一套样式隔离规则。</p>
    <section class="ghost-demo">
      <h3>幽灵依赖演示：axios</h3>
      <p v-if="loading">请求中…</p>
      <p v-else class="tip">{{ tip }}</p>
    </section>
    <ul class="list">
      <li>列表项 1</li>
      <li>列表项 2</li>
    </ul>
  </div>
</template>

<style scoped>
.page-b {
  padding: 1rem;
}
.ghost-demo {
  margin: 1rem 0;
  padding: 1rem;
  background: #fff8e1;
  border: 1px solid #ffc107;
  border-radius: 8px;
}
.ghost-demo h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}
.tip {
  font-size: 0.9rem;
  color: #333;
}
.list {
  list-style: none;
  padding-left: 0;
}
.list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}
</style>
