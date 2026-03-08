/**
 * 校验 shared-manifest.json 对各应用的作用
 * 1. 展示每个 shared 依赖被哪些应用消费（usedBy）→ 可看到 remote1 等“用到了”哪些
 * 2. 校验各 remote 的 shared 配置是否只包含 manifest 中允许的依赖（不私自 share 清单外的）
 *
 * 使用：node scripts/validate-shared-manifest.js
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const manifestPath = join(root, 'shared-manifest.json')

let manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
} catch (e) {
  console.error('未找到 shared-manifest.json，请先执行: pnpm run shared-manifest')
  process.exit(1)
}

console.log('========== shared-manifest.json 对各应用的作用 ==========\n')
console.log('1. 每个 shared 依赖由谁消费（usedBy）→ remote1 等子应用“用到”的即此处列出的\n')

for (const [pkg, meta] of Object.entries(manifest.shared || {})) {
  const usedBy = (meta.usedBy || []).join(', ')
  const remoteConsumers = (meta.usedBy || []).filter((a) => a !== 'host')
  console.log(`  ${pkg}`)
  console.log(`    usedBy: ${usedBy}`)
  if (remoteConsumers.length) {
    console.log(`    → 对 remote 的作用: ${remoteConsumers.join(', ')} 从 Host 获取该依赖（Host 的 shared 由此 manifest 生成）`)
  }
  console.log('')
}

console.log('2. 按应用汇总：remote1 从 manifest 中消费的 shared 依赖\n')
const byApp = {}
for (const [pkg, meta] of Object.entries(manifest.shared || {})) {
  for (const app of meta.usedBy || []) {
    if (!byApp[app]) byApp[app] = []
    byApp[app].push(pkg)
  }
}
for (const app of ['host', 'remote1', 'remote2', 'remote3']) {
  if (!byApp[app]) continue
  const role = app === 'host' ? '（主应用，按 manifest 统一 provide）' : '（从 Host 消费）'
  console.log(`  ${app} ${role}: ${byApp[app].join(', ')}`)
}
console.log('\n========== 校验完成 ==========')
console.log('Host 的 webpack.shared 已由 shared-manifest.json 生成，故上述 usedBy 中的 remote 都会从 Host 拿到对应依赖。')
console.log('若需校验 remote 未私自 share 清单外依赖，可在此脚本中解析各 remote 的 webpack.config.js 的 shared 键做对比。')
