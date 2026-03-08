export interface GlobalModalStyleOptions {
  className?: string
  theme?: 'default' | 'dark'
  width?: string
  style?: Record<string, string>
}

export function useGlobalModal() {
  const bus = typeof window !== 'undefined' ? window.$wujie?.bus : undefined

  const openModal = (
    title: string,
    content: string,
    styleOptions?: GlobalModalStyleOptions,
  ) => {
    bus?.$emit('global:openModal', { title, content, styleOptions })
  }

  const closeModal = () => {
    bus?.$emit('global:closeModal')
  }

  return { openModal, closeModal }
}
