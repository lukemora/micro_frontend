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
