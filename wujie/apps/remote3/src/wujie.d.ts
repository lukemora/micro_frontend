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

export {}
