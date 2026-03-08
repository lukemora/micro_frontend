import { getBus } from './useWujieBus'

export interface GlobalModalStyleOptions {
  className?: string
  theme?: 'default' | 'dark'
  width?: string
  style?: Record<string, string>
}

export function useGlobalModal() {
  const bus = getBus()

  function openModal(
    title: string,
    content: string,
    styleOptions?: GlobalModalStyleOptions,
  ) {
    bus?.$emit('global:openModal', { title, content, styleOptions })
  }

  function closeModal() {
    bus?.$emit('global:closeModal')
  }

  return {
    openModal,
    closeModal,
  }
}
