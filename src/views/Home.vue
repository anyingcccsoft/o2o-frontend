<script setup>
import { onMounted, ref } from 'vue'
import * as noticeApi from '../api/notice'
import * as categoryApi from '../api/category'
import * as dishApi from '../api/dish'
import DishCard from '../components/DishCard.vue'
import { formatTime } from '../utils/format'

const notices = ref([])
const categories = ref([])
const hotDishes = ref([])
const noticeLoading = ref(true)
const hotLoading = ref(true)

onMounted(async () => {
  // 三块数据并行加载，互不阻塞
  noticeApi
    .list()
    .then((list) => {
      notices.value = list || []
    })
    .catch(() => {})
    .finally(() => {
      noticeLoading.value = false
    })

  categoryApi
    .list()
    .then((list) => {
      categories.value = list || []
    })
    .catch(() => {})

  dishApi
    .hot()
    .then((list) => {
      hotDishes.value = list || []
    })
    .catch(() => {})
    .finally(() => {
      hotLoading.value = false
    })
})
</script>

<template>
  <div class="container page-main">
    <!-- 顶部横幅 -->
    <div class="banner">
      <h1>今天想吃点什么？</h1>
      <p>新鲜现做 · 准时送达 · 上海大学周边外卖订餐平台</p>
    </div>

    <!-- 公告轮播 -->
    <el-card class="mt-20" shadow="never">
      <div class="notice-bar">
        <span class="notice-icon">📢</span>
        <div class="notice-body">
          <div v-if="noticeLoading" class="text-sub fs-12">正在加载公告...</div>
          <div v-else-if="notices.length === 0" class="text-sub fs-12">暂无公告</div>
          <el-carousel
            v-else
            height="44px"
            direction="vertical"
            :autoplay="notices.length > 1"
            :interval="4000"
            indicator-position="none"
          >
            <el-carousel-item v-for="n in notices" :key="n.id">
              <div class="notice-item">
                <span class="notice-title">{{ n.title }}</span>
                <span class="notice-content">{{ n.content }}</span>
                <span class="notice-time">{{ formatTime(n.createdAt) }}</span>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>
      </div>
    </el-card>

    <!-- 分类导航 -->
    <el-card class="mt-20" shadow="never">
      <div class="section-title">菜品分类</div>
      <div class="category-nav">
        <span v-if="categories.length === 0" class="text-sub fs-12">暂无分类</span>
        <router-link
          v-for="c in categories"
          :key="c.id"
          :to="{ path: '/dishes', query: { categoryId: c.id } }"
        >
          {{ c.name }}
        </router-link>
      </div>
    </el-card>

    <!-- 热门菜品 -->
    <div class="mt-20">
      <div class="flex-between mb-10">
        <div class="section-title" style="margin-bottom: 0">🔥 热门菜品</div>
        <router-link to="/dishes" class="text-sub fs-12">查看全部菜品 →</router-link>
      </div>
      <div v-loading="hotLoading" class="dish-grid">
        <el-empty
          v-if="!hotLoading && hotDishes.length === 0"
          description="暂无热门菜品"
          style="grid-column: 1 / -1"
        />
        <div v-for="d in hotDishes" :key="d.id" class="hot-item">
          <span class="hot-flag">热销 {{ d.sales || 0 }}</span>
          <DishCard :dish="d" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banner {
  background: linear-gradient(120deg, #ff8c42, #ff6600);
  border-radius: var(--radius);
  color: #fff;
  padding: 36px 30px;
}

.banner h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.banner p {
  opacity: 0.9;
  font-size: 14px;
}

.notice-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notice-icon {
  color: var(--primary);
  font-size: 18px;
  flex-shrink: 0;
}

.notice-body {
  flex: 1;
  min-width: 0;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 44px;
  font-size: 13px;
}

.notice-item .notice-title {
  font-weight: bold;
  flex-shrink: 0;
}

.notice-item .notice-content {
  flex: 1;
  color: var(--text-sub);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.notice-item .notice-time {
  color: var(--text-sub);
  font-size: 12px;
  flex-shrink: 0;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 14px;
}

.category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.category-nav a {
  padding: 10px 26px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.2s;
}

.category-nav a:hover {
  background: var(--primary);
  color: #fff;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  min-height: 120px;
}

.hot-item {
  position: relative;
}

.hot-flag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  z-index: 2;
}

@media (max-width: 900px) {
  .dish-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
