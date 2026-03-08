<script setup lang="ts">
</script>

<template>
  <div class="host-app">
    <header class="host-header">
      <p>Host 主应用</p>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/about">About</router-link>
        <router-link to="/remote1/page-a">Remote1 PageA</router-link>
        <router-link to="/remote1/page-b">Remote1 PageB</router-link>
        <router-link to="/remote2/dashboard">Remote2 Dashboard</router-link>
      </nav>
    </header>
    <main class="host-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.host-app {
  min-height: 100vh;
}
.host-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}
.host-header p {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}
nav a {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  margin-right: 0.5rem;
  color: #42b883;
  text-decoration: none;
}
nav a.router-link-exact-active {
  color: #2c3e50;
  font-weight: 600;
}
.host-main {
  padding: 1.5rem;
}
</style>
