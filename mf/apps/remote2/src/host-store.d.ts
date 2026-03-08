/**
 * Host 暴露的 Pinia store，子应用通过 Module Federation 从 host 加载
 */
declare module 'host/store' {
  export function useAppStore(): {
    count: number
    userName: string
    doubleCount: number
    increment: () => void
    setUserName: (name: string) => void
  }
}
