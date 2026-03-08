import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    count: 0,
    userName: 'Host User',
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count += 1
    },
    setUserName(name: string) {
      this.userName = name
    },
  },
})
