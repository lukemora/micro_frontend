/**
 * Remote1 本地状态，变化时通过 micro-app dispatch 上报给主应用，供主应用展示「子应用状态」。
 */
import { ref, watch, onMounted } from 'vue'

function getMicroApp() {
  return typeof window !== 'undefined' && (window as unknown as { microApp?: { dispatch: (data: Record<string, unknown>) => void } }).microApp
}

export function useRemote1Store() {
  const localCount = ref(0)
  const message = ref('来自 Remote1')

  const microApp = getMicroApp()

  function emitStore() {
    microApp?.dispatch({
      type: 'remote1:store',
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
