/**
 * 动态加载 Host 暴露的模块，供 React 子应用使用状态桥、API、导航。
 * 仅在作为子应用被 Host 加载时可用（此时 Host 的 remoteEntry 已在页面）。
 */

type StateBridge = {
  getState: () => { count: number; userName: string }
  setState: (partial: { count?: number; userName?: string }) => void
  subscribe: (listener: () => void) => () => void
}

type ApiClient = {
  getList: () => Promise<{ items: string[] }>
  getUser: (id: number) => Promise<{ id: number; name: string }>
}

type NavigateFn = (path: string) => void

let stateBridgePromise: Promise<StateBridge> | null = null
let apiPromise: Promise<ApiClient> | null = null
let navigatePromise: Promise<NavigateFn> | null = null

export function getHostStateBridge(): Promise<StateBridge> {
  if (!stateBridgePromise) stateBridgePromise = import('host/sharedStateBridge')
  return stateBridgePromise
}

export function getHostApi(): Promise<ApiClient> {
  if (!apiPromise) apiPromise = import('host/api')
  return apiPromise
}

export function getHostNavigate(): Promise<NavigateFn> {
  if (!navigatePromise) navigatePromise = import('host/navigate').then((m) => m.navigate)
  return navigatePromise
}
