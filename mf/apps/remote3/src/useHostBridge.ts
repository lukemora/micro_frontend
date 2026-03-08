import { useSyncExternalStore, useCallback, useEffect, useState } from 'react'
import { getHostStateBridge } from './hostBridge'

const emptyState = { count: 0, userName: '' }

/** 订阅 Host 状态桥，与 Pinia 双向同步 */
export function useHostStateBridge(): {
  state: { count: number; userName: string }
  setState: (partial: { count?: number; userName?: string }) => void
  ready: boolean
} {
  const [bridge, setBridge] = useState<Awaited<ReturnType<typeof getHostStateBridge>> | null>(null)

  useEffect(() => {
    getHostStateBridge()
      .then(setBridge)
      .catch(() => setBridge(null))
  }, [])

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!bridge) return () => {}
      return bridge.subscribe(onStoreChange)
    },
    [bridge]
  )

  const getSnapshot = useCallback(() => (bridge ? bridge.getState() : emptyState), [bridge])

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const setState = useCallback(
    (partial: { count?: number; userName?: string }) => {
      bridge?.setState(partial)
    },
    [bridge]
  )

  return { state, setState, ready: !!bridge }
}
