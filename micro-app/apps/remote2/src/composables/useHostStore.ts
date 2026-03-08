/**
 * 子应用内使用「主应用 Pinia」：通过 micro-app addDataListener 接收 host 下发的 hostStore，
 * 通过 dispatch({ type: 'host:action', payload }) 触发主应用 store 的 action。
 */
import { ref, onMounted, onUnmounted } from 'vue'

export interface HostStoreState {
  count: number
  userName: string
}

function getMicroApp() {
  return typeof window !== 'undefined' && (window as unknown as { microApp?: { addDataListener: (cb: (data: HostStoreState & { hostStore?: HostStoreState }) => void, auto?: boolean) => void; removeDataListener: (cb: (data: unknown) => void) => void; dispatch: (data: Record<string, unknown>) => void } }).microApp
}

export function useHostStore() {
  const count = ref(0)
  const userName = ref('Host User')
  const ready = ref(false)

  const microApp = getMicroApp()

  function onData(data: Record<string, unknown>) {
    const hostStore = data.hostStore as HostStoreState | undefined
    if (hostStore) {
      count.value = hostStore.count
      userName.value = hostStore.userName
      ready.value = true
    }
  }

  function increment() {
    microApp?.dispatch({ type: 'host:action', payload: { type: 'increment' } })
  }

  function setUserName(name: string) {
    microApp?.dispatch({ type: 'host:action', payload: { type: 'setUserName', payload: name } })
  }

  onMounted(() => {
    if (microApp) {
      microApp.addDataListener(onData, true)
    }
  })

  onUnmounted(() => {
    if (microApp) microApp.removeDataListener(onData)
  })

  return {
    count,
    userName,
    ready,
    increment,
    setUserName,
  }
}
