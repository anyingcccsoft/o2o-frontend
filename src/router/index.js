import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Login from '../views/Login.vue'

const routes = [
  { path: '/login', name: 'login', component: Login },
  { path: '/', name: 'home', component: () => import('../views/Home.vue') },
  { path: '/dishes', name: 'dishes', component: () => import('../views/DishList.vue') },
  { path: '/dishes/:id', name: 'dish-detail', component: () => import('../views/DishDetail.vue') },
  { path: '/cart', name: 'cart', component: () => import('../views/Cart.vue'), meta: { requiresAuth: true } },
  { path: '/order-confirm', name: 'order-confirm', component: () => import('../views/OrderConfirm.vue'), meta: { requiresAuth: true } },
  { path: '/orders', name: 'orders', component: () => import('../views/OrderList.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:id', name: 'order-detail', component: () => import('../views/OrderDetail.vue'), meta: { requiresAuth: true } },
  { path: '/address', name: 'address', component: () => import('../views/Address.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 登录守卫：requiresAuth 页面未登录时先探测一次 session，仍未登录则跳登录页
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const userStore = useUserStore()
  if (!userStore.isLogin) {
    await userStore.fetchInfo()
  }
  if (!userStore.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
