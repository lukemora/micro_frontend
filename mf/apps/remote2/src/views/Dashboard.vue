<script setup lang="ts">
</script>

<template>
  <div class="dashboard">
    <h2>Remote2 - Dashboard</h2>
    <p class="intro">子应用 remote2 暴露的仪表盘，使用 .remote2-mf 命名空间做样式隔离。</p>
    <div class="stats">
      <div class="stat-item">统计 A</div>
      <div class="stat-item">统计 B</div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 1rem;
  max-width: 560px;
}
.intro {
  color: #666;
  margin-bottom: 1rem;
}
.stats {
  display: flex;
  gap: 1rem;
}
.stat-item {
  flex: 1;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 8px;
  border: 1px solid #90caf9;
  text-align: center;
}
</style>
