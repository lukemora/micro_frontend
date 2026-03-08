/**
 * 扫描所有微应用的 package.json，生成“共享依赖清单” shared-manifest.json
 * 主应用应据此统一 share，微应用只管用，避免幽灵依赖与版本分裂
 *
 * 使用：node scripts/generate-shared-manifest.js
 * 输出：shared-manifest.json（可被主应用或 CI 引用）
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const appsDir = join(root, 'apps')

// 只统计这些“基础/共享”依赖（避免把业务依赖都算进去）
const SHARED_CANDIDATES = new Set([
  'vue',
  'vue-router',
  'pinia',
  'vuex',
  'lodash',
  'axios',
  'element-plus',
  'element-ui',
  'react',
  'react-dom',
  'react-router-dom',
])

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  shared: {},
  apps: [],
}

const appNames = ['host', 'remote1', 'remote2', 'remote3']

for (const appName of appNames) {
  const pkgPath = join(appsDir, appName, 'package.json')
  const pkg = readJson(pkgPath)
  if (!pkg) continue

  const deps = { ...pkg.dependencies, ...(pkg.devDependencies || {}) }
  for (const [name, version] of Object.entries(deps)) {
    if (!SHARED_CANDIDATES.has(name)) continue
    if (!manifest.shared[name]) {
      manifest.shared[name] = { requiredVersion: version, singleton: true, usedBy: [] }
    }
    if (!manifest.shared[name].usedBy.includes(appName)) {
      manifest.shared[name].usedBy.push(appName)
    }
    // 若某应用版本更严格，可在此合并 requiredVersion（这里简单取首次出现的版本）
  }
  manifest.apps.push({ name: appName, dependencies: pkg.dependencies || {} })
}

const outPath = join(root, 'shared-manifest.json')
writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf-8')
console.log('Written:', outPath)
console.log('Shared packages:', Object.keys(manifest.shared))
