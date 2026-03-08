<script setup lang="ts">
import { useSubAppState } from '@/composables/useSubAppState'

const { remote1State, remote2State } = useSubAppState()
</script>

<template>
  <div class="host-app">
    <header class="host-header">
      <p>Host 主应用（Micro-App 微前端）</p>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/about">About</router-link>
        <router-link to="/style-isolation">样式隔离</router-link>
        <router-link to="/remote1/page-a">Remote1 PageA</router-link>
        <router-link to="/remote1/page-b">Remote1 PageB</router-link>
        <router-link to="/remote2/dashboard">Remote2 Dashboard</router-link>
        <router-link to="/remote3">Remote3 (React)</router-link>
      </nav>
    </header>
    <aside v-if="remote1State || remote2State" class="host-sub-state">
      <p class="host-sub-state-title">子应用状态（由子应用 dispatch 上报）</p>
      <div v-if="remote1State" class="host-sub-state-block">
        <strong>Remote1</strong>: localCount={{ remote1State.localCount }}
        <span v-if="remote1State.message">, {{ remote1State.message }}</span>
      </div>
      <div v-if="remote2State" class="host-sub-state-block">
        <strong>Remote2</strong>: statsClicks={{ remote2State.statsClicks }}
        <span v-if="remote2State.message">, {{ remote2State.message }}</span>
      </div>
    </aside>
    <main class="host-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.host-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  flex: 1;
}
.host-sub-state {
  padding: 0.75rem 1rem;
  background: #f0f9ff;
  border-bottom: 1px solid #bae6fd;
  font-size: 0.875rem;
}
.host-sub-state-title {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #0369a1;
}
.host-sub-state-block {
  margin-top: 0.25rem;
}
.host-sub-state-block + .host-sub-state-block {
  margin-top: 0.5rem;
}
</style>
