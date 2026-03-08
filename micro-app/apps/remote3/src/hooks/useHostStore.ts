/**
 * React 子应用内使用「主应用 Pinia」：通过 micro-app addDataListener 接收 host 下发的 hostStore，
 * 通过 dispatch({ type: 'host:action', payload }) 触发主应用 store 的 action。
 */
import { useState, useEffect } from 'react'

interface HostStoreState {
  count: number
  userName: string
}

interface MicroAppAPI {
  addDataListener: (cb: (data: Record<string, unknown>) => void, auto?: boolean) => void
  removeDataListener: (cb: (data: Record<string, unknown>) => void) => void
  dispatch: (data: Record<string, unknown>) => void
}

function getMicroApp(): MicroAppAPI | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { microApp?: MicroAppAPI }).microApp
}

export function useHostStore() {
  const [count, setCount] = useState(0)
  const [userName, setUserNameState] = useState('Host User')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const api = getMicroApp()
    if (!api) return

    const onData = (data: Record<string, unknown>) => {
      const hostStore = data.hostStore as HostStoreState | undefined
      if (hostStore) {
        setCount(hostStore.count)
        setUserNameState(hostStore.userName)
        setReady(true)
      }
    }

    api.addDataListener(onData, true)
    return () => api.removeDataListener(onData)
  }, [])

  const microApp = getMicroApp()

  const increment = () => {
    microApp?.dispatch({ type: 'host:action', payload: { type: 'increment' } })
  }

  const setUserName = (name: string) => {
    microApp?.dispatch({ type: 'host:action', payload: { type: 'setUserName', payload: name } })
  }

  return {
    count,
    userName,
    ready,
    increment,
    setUserName,
  }
}
