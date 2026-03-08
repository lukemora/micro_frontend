/**
 * 与框架无关的全局状态桥：供 React 等异构子应用与 Host 的 Pinia 同步同一份逻辑状态。
 * Host 的 Pinia 通过 $subscribe 写入此处；Remote3 通过 getState/subscribe 读取并驱动 Zustand 或 useSyncExternalStore。
 */

export interface SharedState {
  count: number
  userName: string
}

const initialState: SharedState = {
  count: 0,
  userName: 'Host User',
}

let state: SharedState = { ...initialState }
const listeners = new Set<() => void>()

export function getState(): SharedState {
  return { ...state }
}

export function setState(partial: Partial<SharedState>): void {
  state = { ...state, ...partial }
  listeners.forEach((cb) => cb())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
