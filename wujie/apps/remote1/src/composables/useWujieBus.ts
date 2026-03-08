/**
 * 子应用内获取无界 bus（仅在 Wujie 环境下存在）
 */
declare global {
  interface Window {
    $wujie?: {
      bus: {
        $on: (event: string, fn: (...args: unknown[]) => void) => void
        $emit: (event: string, ...args: unknown[]) => void
        $off: (event: string, fn: (...args: unknown[]) => void) => void
      }
      props?: Record<string, unknown>
    }
  }
}

export function getBus() {
  return typeof window !== 'undefined' ? window.$wujie?.bus : undefined
}

export function isInWujie() {
  return Boolean(typeof window !== 'undefined' && window.$wujie)
}
