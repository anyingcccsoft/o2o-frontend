<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'

const route = useRoute()
// 登录/注册页隐藏导航栏，保持页面简洁
const showNav = computed(() => route.path !== '/login')
</script>

<template>
  <div class="app-layout">
    <NavBar v-if="showNav" />
    <main class="app-main">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
}
</style>
