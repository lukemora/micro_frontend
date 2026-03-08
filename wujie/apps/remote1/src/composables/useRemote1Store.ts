/**
 * Remote1 本地状态，变化时通过 bus 上报给 Host，供主应用展示「子应用 Pinia」。
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { getBus } from './useWujieBus'

export function useRemote1Store() {
  const localCount = ref(0)
  const message = ref('来自 Remote1')

  const bus = getBus()

  function emitStore() {
    bus?.$emit('remote1:store', {
      localCount: localCount.value,
      message: message.value,
    })
  }

  watch([localCount, message], emitStore, { immediate: true })

  onMounted(() => {
    emitStore()
  })

  return {
    localCount,
    message,
    emitStore,
  }
}
