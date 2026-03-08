import { ref, watch, onMounted } from 'vue'
import { getBus } from './useWujieBus'

export function useRemote2Store() {
  const statsClicks = ref(0)
  const message = ref('来自 Remote2')

  const bus = getBus()

  function emitStore() {
    bus?.$emit('remote2:store', {
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
