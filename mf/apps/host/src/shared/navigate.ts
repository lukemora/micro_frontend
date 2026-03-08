/**
 * 与框架无关的导航：子应用（含 React）调用后可驱动 Host 的 Vue Router 更新。
 * 使用 history.pushState + popstate，与 createWebHistory 兼容。
 */

export function navigate(path: string): void {
  const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  const full = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`
  window.history.pushState({}, '', full)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
