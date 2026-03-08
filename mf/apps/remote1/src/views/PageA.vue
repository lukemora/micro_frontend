<script setup lang="ts">
</script>

<template>
  <div class="page-a">
    <h2>Remote1 - Page A</h2>
    <p class="desc">子应用 remote1 暴露的页面组件，样式通过 .remote1-mf 命名空间隔离。</p>
    <div class="card">
      <span class="card-title">卡片内容</span>
    </div>
  </div>
</template>

<style scoped>
.page-a {
  padding: 1rem;
  max-width: 560px;
}
.desc {
  color: #666;
  margin-bottom: 1rem;
}
.card {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}
.card-title {
  font-weight: 600;
  color: #42b883;
}
</style>

<style>
/* 未加 scoped 的样式会被 postcss-selector-namespace 加上 .remote1-mf 前缀，仅影响本组件根 section 内 */
.page-a h2 {
  margin-top: 0;
  color: #2c3e50;
}
</style>
