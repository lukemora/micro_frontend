/**
 * 从 shared-manifest.json 生成 Webpack Module Federation 的 shared 配置
 * Host 主应用使用此配置，保证“主应用统一 share、微应用只管用”
 *
 * @param {string} manifestPath - shared-manifest.json 的路径
 * @param {object} opts - { eager: string[] } 需要 eager 加载的包名（如 ['vue', 'vue-router']）
 * @returns {object} shared 配置对象
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

export function getSharedConfigFromManifest(manifestPath = join(root, 'shared-manifest.json'), opts = {}) {
  const { eager = ['vue', 'vue-router'] } = opts
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  } catch (e) {
    console.warn('[shared-config-from-manifest] 未找到或无法解析 shared-manifest.json，使用空 shared')
    return {}
  }
  const shared = {}
  for (const [name, meta] of Object.entries(manifest.shared || {})) {
    shared[name] = {
      singleton: meta.singleton !== false,
      requiredVersion: meta.requiredVersion || '*',
      ...(eager.includes(name) ? { eager: true } : {}),
    }
  }
  return shared
}
