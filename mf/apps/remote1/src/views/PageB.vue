<script setup lang="ts">
</script>

<template>
  <div class="page-b">
    <h2>Remote1 - Page B</h2>
    <p>同一子应用的另一页面，共用同一套样式隔离规则。</p>
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
.list {
  list-style: none;
  padding-left: 0;
}
.list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}
</style>
