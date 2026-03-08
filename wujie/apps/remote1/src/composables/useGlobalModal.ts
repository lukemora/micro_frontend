/**
 * 子应用内打开「主应用提供的全局弹窗」：通过 bus 通知 Host，弹窗在 document 层渲染，可覆盖整个页面（含 iframe）。
 * 可通过 styleOptions 让主应用应用样式（主应用对 className/style 做白名单控制）。
 */
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
