/**
 * Host 通过 MF 暴露的模块，供 Remote3（React）消费
 */
declare module 'host/sharedStateBridge' {
  export interface SharedState {
    count: number
    userName: string
  }
  export function getState(): SharedState
  export function setState(partial: Partial<SharedState>): void
  export function subscribe(listener: () => void): () => void
}

declare module 'host/api' {
  export function getList(): Promise<{ items: string[] }>
  export function getUser(id: number): Promise<{ id: number; name: string }>
}

declare module 'host/navigate' {
  export function navigate(path: string): void
}
