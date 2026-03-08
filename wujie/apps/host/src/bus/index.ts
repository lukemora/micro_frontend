/**
 * 主应用侧：通过 bus 同步 Host Pinia 给子应用，接收子应用状态，处理全局弹窗。
 * 事件约定：
 * - host:store  主应用发出，payload: { count, userName }
 * - host:action  子应用发出，payload: { type, payload? }
 * - remote1:store / remote2:store  子应用发出，主应用展示
 * - global:openModal  payload: { title, content }
 * - global:closeModal
 */
import WujieVue from 'wujie-vue3'
import { useAppStore } from '@/store'

const { bus } = WujieVue

export { bus }

/** 主应用 Pinia 同步到子应用：store 变化时广播 */
export function setupHostStoreSync() {
  const store = useAppStore()

  function emitStore() {
    bus.$emit('host:store', {
      count: store.count,
      userName: store.userName,
    })
  }

  store.$subscribe(emitStore)
  emitStore()

  bus.$on('host:requestStore', () => {
    emitStore()
  })

  bus.$on('host:action', (data: { type: string; payload?: unknown }) => {
    const { type, payload } = data
    if (type === 'increment') store.increment()
    else if (type === 'setUserName' && typeof payload === 'string') store.setUserName(payload)
    // emitStore 会由 $subscribe 自动触发
  })
}
