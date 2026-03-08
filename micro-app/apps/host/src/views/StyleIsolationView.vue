<script setup lang="ts">
/**
 * 样式隔离：方案说明 + 演示。
 * 本 demo 使用 iframe 沙箱，主/子应用 DOM 完全隔离，样式天然互不影响。
 */
import { REMOTE1_BASE } from '@/constants/remote'
import { useSubAppState } from '@/composables/useSubAppState'

const { handleDatachange } = useSubAppState()
const remote1Url = `${REMOTE1_BASE}/`
const defaultPage = '/page-a'

function onDatachange(e: CustomEvent<{ data: Record<string, unknown> }>) {
  handleDatachange('remote1', e.detail?.data ?? {})
}
</script>

<template>
  <div class="style-isolation-page">
    <h1>样式隔离 · 方案说明与演示</h1>

    <section class="scheme-section">
      <h2>一、方案说明</h2>
      <p>Micro-App 的样式隔离机制与可选配置如下，完整方案说明见仓库内 <code>docs/STYLE-ISOLATION.md</code>。</p>
      <ul class="scheme-list">
        <li><strong>默认（开启 scopecss）</strong>：框架为子应用的 CSS 选择器添加 <code>micro-app[name=xxx]</code> 前缀，使子应用样式只作用于当前 micro-app 容器内，<strong>防止子应用样式影响主应用</strong>。注意：<strong>无法阻止主应用样式影响子应用</strong>（主应用选择器仍可命中子应用 DOM，若使用 with 沙箱）。</li>
        <li><strong>disable-scopecss</strong>：关闭样式隔离，子应用样式不再加前缀，可能泄漏到主应用；可提升渲染性能，需确保应用间无类名冲突。</li>
        <li><strong>iframe 沙箱</strong>（本 demo 使用）：子应用运行在独立 iframe 中，主/子应用 DOM 与样式<strong>完全隔离</strong>，主应用样式不会穿透进 iframe，子应用样式也不会影响主应用。</li>
        <li><strong>with 沙箱</strong>：子应用运行在 Shadow DOM 内，主文档样式一般不穿透 Shadow 边界；scopecss 仍用于防止子应用样式泄漏到主文档。</li>
      </ul>
    </section>

    <section class="demo-section">
      <h2>二、演示：主应用区域 vs 子应用区域</h2>
      <p>下方「主应用区域」使用主应用内定义的全局样式（绿色边框、浅绿背景）；其下为嵌入的 Remote1 子应用。本 demo 使用 <strong>iframe 沙箱</strong>，两区域样式互不影响。</p>
      <div class="style-demo-host-only">
        <strong>主应用区域</strong>：此区块使用主应用样式（.style-demo-host-only），与子应用内的 .card、.demo-section 等互不污染。
      </div>
      <div class="micro-app-wrapper">
        <p class="wrapper-hint">以下为子应用 Remote1 PageA（iframe 内），其内部样式仅作用于子应用。</p>
        <micro-app
          name="style-isolation-demo"
          :url="remote1Url"
          :default-page="defaultPage"
          @datachange="onDatachange"
        />
      </div>
    </section>

    <section class="scheme-section">
      <h2>三、与其它方案对比</h2>
      <table class="compare-table">
        <thead>
          <tr>
            <th>方案</th>
            <th>子应用 → 主应用</th>
            <th>主应用 → 子应用</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Micro-App 默认（scopecss）</td>
            <td>子应用选择器加前缀，不泄漏</td>
            <td>主应用样式可影响子应用（with 沙箱时）</td>
          </tr>
          <tr>
            <td>Micro-App iframe 沙箱</td>
            <td>完全隔离</td>
            <td>完全隔离</td>
          </tr>
          <tr>
            <td>Wujie</td>
            <td>iframe 天然隔离</td>
            <td>iframe 天然隔离</td>
          </tr>
          <tr>
            <td>MF / qiankun（同文档）</td>
            <td>依赖前缀或约定</td>
            <td>主应用易污染子应用，需主应用前缀或最小化主应用样式</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.style-isolation-page {
  max-width: 900px;
}
.style-isolation-page h1 {
  margin-top: 0;
}
.scheme-section {
  margin-top: 2rem;
  padding: 1.25rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}
.scheme-section h2 {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
}
.scheme-list {
  margin: 0.5rem 0 0 1rem;
  padding-left: 1rem;
}
.scheme-list li {
  margin-top: 0.35rem;
}
.scheme-list code {
  background: #eee;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}
.demo-section {
  margin-top: 2rem;
  padding: 1.25rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}
.demo-section h2 {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
}
.demo-section p {
  margin: 0 0 0.75rem 0;
  color: #555;
}
.wrapper-hint {
  font-size: 0.875rem;
  color: #0369a1;
  margin-bottom: 0.5rem;
}
.micro-app-wrapper {
  min-height: 320px;
}
.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.compare-table th,
.compare-table td {
  border: 1px solid #e0e0e0;
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.compare-table th {
  background: #f5f5f5;
  font-weight: 600;
}
</style>

<!-- 仅本页使用的主应用全局样式，用于演示「主应用区域」与子应用视觉区分 -->
<style>
.style-demo-host-only {
  padding: 1rem 1.25rem;
  background: #e8f5e9;
  border: 2px solid #4caf50;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}
</style>
