/**
 * 主应用侧：收集各子应用通过 bus 上报的状态，用于在 Host 中展示。
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { bus } from '@/bus'

export interface Remote1State {
  localCount: number
  message?: string
}

export interface Remote2State {
  statsClicks: number
  message?: string
}

const remote1State = ref<Remote1State | null>(null)
const remote2State = ref<Remote2State | null>(null)

export function useSubAppState() {
  function onRemote1Store(state: Remote1State) {
    remote1State.value = state
  }

  function onRemote2Store(state: Remote2State) {
    remote2State.value = state
  }

  onMounted(() => {
    bus.$on('remote1:store', onRemote1Store)
    bus.$on('remote2:store', onRemote2Store)
  })

  onUnmounted(() => {
    bus.$off('remote1:store', onRemote1Store)
    bus.$off('remote2:store', onRemote2Store)
  })

  return {
    remote1State,
    remote2State,
  }
}
