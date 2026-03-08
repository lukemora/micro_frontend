/**
 * 子应用内使用「主应用 Pinia」：通过 bus 同步的 host 状态 + 派发 action。
 * Host 会 emit host:store，子应用监听并更新本地 ref；子应用通过 host:action 触发 Host 的 store 变更。
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { getBus } from './useWujieBus'

export interface HostStoreState {
  count: number
  userName: string
}

export function useHostStore() {
  const count = ref(0)
  const userName = ref('Host User')
  const ready = ref(false)

  const bus = getBus()

  function onHostStore(state: HostStoreState) {
    count.value = state.count
    userName.value = state.userName
    ready.value = true
  }

  function increment() {
    bus?.$emit('host:action', { type: 'increment' })
  }

  function setUserName(name: string) {
    bus?.$emit('host:action', { type: 'setUserName', payload: name })
  }

  onMounted(() => {
    if (bus) {
      bus.$on('host:store', onHostStore)
      bus.$emit('host:requestStore')
    }
  })

  onUnmounted(() => {
    if (bus) bus.$off('host:store', onHostStore)
  })

  return {
    count,
    userName,
    ready,
    increment,
    setUserName,
  }
}
