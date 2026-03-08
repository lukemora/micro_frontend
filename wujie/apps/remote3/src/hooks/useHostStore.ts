import { useState, useEffect, useCallback } from 'react'

interface HostStoreState {
  count: number
  userName: string
}

export function useHostStore() {
  const [state, setState] = useState<HostStoreState>({ count: 0, userName: 'Host User' })
  const [ready, setReady] = useState(false)

  const bus = typeof window !== 'undefined' ? window.$wujie?.bus : undefined

  useEffect(() => {
    if (!bus) return

    const onStore = (payload: HostStoreState) => {
      setState(payload)
      setReady(true)
    }

    bus.$on('host:store', onStore)
    bus.$emit('host:requestStore')

    return () => {
      bus.$off('host:store', onStore)
    }
  }, [bus])

  const increment = useCallback(() => {
    bus?.$emit('host:action', { type: 'increment' })
  }, [bus])

  const setUserName = useCallback(
    (name: string) => {
      bus?.$emit('host:action', { type: 'setUserName', payload: name })
    },
    [bus],
  )

  return { ...state, ready, increment, setUserName }
}
