import { defineStore } from 'pinia'
import * as userApi from '../api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
  }),
  getters: {
    isLogin: (state) => !!state.userInfo,
  },
  actions: {
    /**
     * 探测登录态：401 时静默置空、不跳转（供导航栏/路由守卫使用）
     */
    async fetchInfo() {
      try {
        this.userInfo = await userApi.getInfo({ silent401: true })
      } catch (e) {
        this.userInfo = null
      }
      return this.userInfo
    },
    setInfo(info) {
      this.userInfo = info
    },
    async logout() {
      try {
        await userApi.logout()
      } finally {
        this.userInfo = null
      }
    },
  },
})
