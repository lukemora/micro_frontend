/**
 * 微前端子应用配置与按需加载：仅当访问对应子应用路由时才加载该 remote 的 remoteEntry。
 */

export interface RemoteApp {
  name: string
  /** remoteEntry.js 的完整 URL */
  chunk: string
  routePrefix: string
}

const isProduction = process.env.NODE_ENV === 'production'

export const REMOTE_APPS: RemoteApp[] = [
  {
    name: 'remote1',
    chunk: isProduction ? '/remote1/remoteEntry.js' : 'http://localhost:3001/remoteEntry.js',
    routePrefix: '/remote1',
  },
  {
    name: 'remote2',
    chunk: isProduction ? '/remote2/remoteEntry.js' : 'http://localhost:3002/remoteEntry.js',
    routePrefix: '/remote2',
  },
  {
    name: 'remote3',
    chunk: isProduction ? '/remote3/remoteEntry.js' : 'http://localhost:3003/remoteEntry.js',
    routePrefix: '/remote3',
  },
]

export function getRemoteAppByPath(path: string): RemoteApp | undefined {
  return REMOTE_APPS.find((app) => path.startsWith(app.routePrefix))
}

const loadedRemotes = new Set<string>()
export function isRemoteLoaded(name: string): boolean {
  return loadedRemotes.has(name)
}
export function markRemoteLoaded(name: string): void {
  loadedRemotes.add(name)
}

export { loadScript as loadRemoteScript } from '../../util/remote'

/**
 * 按需加载：先 loadScript(remoteEntry)，再 loadComponent(scope, moduleName)，返回模块（含 default 组件）。
 */
export async function getRemoteComponent(
  remoteName: string,
  moduleName: string
): Promise<{ default: unknown }> {
  const app = REMOTE_APPS.find((a) => a.name === remoteName)
  if (!app) throw new Error(`Unknown remote: ${remoteName}`)
  const { loadScript, loadComponent } = await import('../../util/remote')
  await loadScript(app.chunk)
  return loadComponent(remoteName, moduleName)
}
