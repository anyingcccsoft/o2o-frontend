import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import * as cartApi from '../api/cart'

export const useCartStore = defineStore('cart', {
  state: () => ({
    count: 0,
  }),
  actions: {
    /**
     * 刷新购物车角标数量（quantity 求和），未登录时静默置 0
     */
    async refresh() {
      try {
        const items = await cartApi.list({ silent401: true })
        this.count = (items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
      } catch (e) {
        this.count = 0
      }
    },
    async addToCart(dishId, quantity = 1) {
      await cartApi.add({ dishId, quantity })
      await this.refresh()
      ElMessage.success('已加入购物车')
    },
  },
})
