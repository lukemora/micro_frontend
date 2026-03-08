/**
 * 主应用侧：收集各子应用通过 micro-app dispatch 上报的状态，并处理子应用发来的 host:action。
 * 子应用通过 window.microApp.dispatch({ type: 'remote1:store', localCount, message }) 等上报；
 * 主应用在各 <micro-app> 上监听 @datachange，调用 handleDatachange(appKey, e.detail.data)。
 */
import { ref, type Ref } from 'vue'
import microApp from '@micro-zoe/micro-app'
import { useAppStore } from '@/store'

export interface Remote1State {
  localCount: number
  message?: string
}

export interface Remote2State {
  statsClicks: number
  message?: string
}

const remote1State: Ref<Remote1State | null> = ref(null)
const remote2State: Ref<Remote2State | null> = ref(null)

/** 子应用名称列表，用于主应用 setData 广播 hostStore */
export const MICRO_APP_NAMES = [
  'remote1-page-a',
  'remote1-page-b',
  'remote2-dashboard',
  'remote3',
  'style-isolation-demo',
] as const

export function useSubAppState() {
  const store = useAppStore()

  function handleDatachange(_appKey: string, data: Record<string, unknown>) {
    if (data.type === 'host:action') {
      const payload = data.payload as { type: string; payload?: unknown }
      if (payload?.type === 'increment') store.increment()
      else if (payload?.type === 'setUserName' && typeof payload.payload === 'string')
        store.setUserName(payload.payload)
      return
    }
    if (data.type === 'remote1:store') {
      remote1State.value = {
        localCount: (data.localCount as number) ?? 0,
        message: data.message as string | undefined,
      }
      return
    }
    if (data.type === 'remote2:store') {
      remote2State.value = {
        statsClicks: (data.statsClicks as number) ?? 0,
        message: data.message as string | undefined,
      }
    }
  }

  return {
    remote1State,
    remote2State,
    handleDatachange,
  }
}

/** 主应用 Pinia 同步到子应用：store 变化时向所有子应用 setData */
export function setupHostStoreSync() {
  const store = useAppStore()

  function emitStore() {
    const payload = {
      hostStore: {
        count: store.count,
        userName: store.userName,
      },
    }
    MICRO_APP_NAMES.forEach((name) => {
      microApp.setData(name, payload)
    })
  }

  store.$subscribe(emitStore)
  emitStore()
}
