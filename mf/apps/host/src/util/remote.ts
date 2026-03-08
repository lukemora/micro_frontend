/**
 * 动态加载子应用 remoteEntry，再通过 container.get 取模块。
 * 主应用不在任何地方静态 import('remoteX/...')，仅在此处按需加载，未访问的子应用不会请求 remoteEntry。
 */

declare global {
  interface Window {
    remote1?: { init: (shareScope: unknown) => Promise<void>; get: (module: string) => Promise<() => unknown> }
    remote2?: { init: (shareScope: unknown) => Promise<void>; get: (module: string) => Promise<() => unknown> }
  }
  const __webpack_init_sharing__: (scope: string) => Promise<void>
  const __webpack_share_scopes__: { default: unknown }
}

export async function loadScript(url: string): Promise<string> {
  const existing = document.querySelector(`script[src="${url}"]`)
  if (existing) return url

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.type = 'text/javascript'
    script.async = false
    script.onload = () => resolve(url)
    script.onerror = () => reject(new Error(`Failed to load: ${url}`))
    document.head.appendChild(script)
  })
}

export async function loadComponent(
  scope: string,
  moduleName: string
): Promise<{ default: unknown }> {
  if (typeof __webpack_init_sharing__ !== 'undefined') {
    await __webpack_init_sharing__('default')
  }

  const container = (window as Window)[scope as keyof Window]
  if (!container || typeof (container as { init?: unknown }).init !== 'function') {
    throw new Error(`Remote container not found: ${scope}. Load remoteEntry first.`)
  }

  const shareScope =
    typeof __webpack_share_scopes__ !== 'undefined' && __webpack_share_scopes__.default
      ? __webpack_share_scopes__.default
      : {}
  await (container as { init: (s: unknown) => Promise<void> }).init(shareScope)

  const factory = await (container as { get: (m: string) => Promise<() => unknown> }).get(moduleName)
  const module = factory()
  return module as { default: unknown }
}
