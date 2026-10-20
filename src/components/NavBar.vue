<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingCart, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const keyword = ref('')

function onSearch() {
  const kw = keyword.value.trim()
  router.push({ path: '/dishes', query: kw ? { keyword: kw } : {} })
}

async function onCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'address') {
    router.push('/address')
  } else if (command === 'orders') {
    router.push('/orders')
  } else if (command === 'logout') {
    await userStore.logout()
    cartStore.count = 0
    ElMessage.success('已退出登录')
    router.push('/')
  }
}

function goLogin() {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

onMounted(async () => {
  await userStore.fetchInfo()
  if (userStore.isLogin) {
    cartStore.refresh()
  }
})
</script>

<template>
  <header class="navbar">
    <div class="container navbar-inner">
      <router-link to="/" class="logo">上大外卖</router-link>

      <nav class="nav-links">
        <router-link to="/" exact-active-class="active">首页</router-link>
        <router-link to="/dishes" :class="{ active: route.path === '/dishes' }">全部菜品</router-link>
        <router-link to="/orders" :class="{ active: route.path.startsWith('/orders') }">我的订单</router-link>
      </nav>

      <div class="nav-search">
        <el-input
          v-model="keyword"
          placeholder="搜索菜品"
          clearable
          @keyup.enter="onSearch"
        >
          <template #append>
            <el-button @click="onSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="nav-right">
        <template v-if="userStore.isLogin">
          <el-badge :value="cartStore.count" :hidden="cartStore.count <= 0" class="cart-badge">
            <el-button :icon="ShoppingCart" circle @click="router.push('/cart')" />
          </el-badge>
          <el-dropdown @command="onCommand">
            <span class="user-name">
              {{ userStore.userInfo?.nickname || userStore.userInfo?.username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="address">收货地址</el-dropdown-item>
                <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button type="primary" @click="goLogin">登录 / 注册</el-button>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background: #fff;
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 60px;
}

.logo {
  font-size: 22px;
  font-weight: bold;
  color: var(--primary);
  white-space: nowrap;
}

.nav-links {
  display: flex;
  gap: 20px;
  white-space: nowrap;
}

.nav-links a {
  color: var(--text-main);
  padding: 4px 2px;
}

.nav-links a:hover,
.nav-links a.active {
  color: var(--primary);
}

.nav-search {
  flex: 1;
  max-width: 320px;
}

.nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;
}

.cart-badge {
  margin-right: 4px;
}

.user-name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--text-main);
  outline: none;
}
</style>
