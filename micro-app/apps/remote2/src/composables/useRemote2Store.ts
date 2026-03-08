/**
 * Remote2 本地状态，变化时通过 micro-app dispatch 上报给主应用。
 */
import { ref, watch, onMounted } from 'vue'

function getMicroApp() {
  return typeof window !== 'undefined' && (window as unknown as { microApp?: { dispatch: (data: Record<string, unknown>) => void } }).microApp
}

export function useRemote2Store() {
  const statsClicks = ref(0)
  const message = ref('来自 Remote2')

  const microApp = getMicroApp()

  function emitStore() {
    microApp?.dispatch({
      type: 'remote2:store',
      statsClicks: statsClicks.value,
      message: message.value,
    })
  }

  watch([statsClicks, message], emitStore, { immediate: true })

  onMounted(() => {
    emitStore()
  })

  return {
    statsClicks,
    message,
  }
}
