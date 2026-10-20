<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as categoryApi from '../api/category'
import * as dishApi from '../api/dish'
import DishCard from '../components/DishCard.vue'

const route = useRoute()
const router = useRouter()

const categories = ref([])
const dishes = ref([])
const total = ref(0)
const loading = ref(false)

// 查询状态：以路由 query 为准（支持 categoryId / keyword / page 初始化与分享）
const categoryId = ref('')
const keyword = ref('')
const page = ref(1)
const pageSize = 9

// 搜索框输入值（点击搜索才生效）
const searchInput = ref('')

// 请求序号守卫：仅最新一次请求的响应才允许写入状态，避免快速切换时旧响应覆盖新结果
let currentReqId = 0

async function loadDishes() {
  const reqId = ++currentReqId
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (categoryId.value) params.categoryId = categoryId.value
    if (keyword.value) params.keyword = keyword.value
    const pr = await dishApi.list(params)
    if (reqId !== currentReqId) return
    dishes.value = pr?.records || []
    total.value = pr?.total || 0
  } catch (e) {
    if (reqId !== currentReqId) return
    dishes.value = []
    total.value = 0
  } finally {
    if (reqId === currentReqId) loading.value = false
  }
}

/** 将查询状态写入路由 query（触发 watch 重新加载） */
function pushQuery(patch = {}) {
  const next = {
    categoryId: categoryId.value,
    keyword: keyword.value,
    page: page.value,
    ...patch,
  }
  const query = {}
  if (next.categoryId) query.categoryId = next.categoryId
  if (next.keyword) query.keyword = next.keyword
  if (next.page && next.page > 1) query.page = next.page
  router.push({ path: '/dishes', query })
}

function onCategory(cid) {
  pushQuery({ categoryId: cid, page: 1 })
}

function doSearch() {
  pushQuery({ keyword: searchInput.value.trim(), page: 1 })
}

function doReset() {
  searchInput.value = ''
  pushQuery({ categoryId: '', keyword: '', page: 1 })
}

function onPageChange(p) {
  pushQuery({ page: p })
  window.scrollTo({ top: 0 })
}

// 路由 query 变化（含首次进入、导航栏搜索、分类跳转）→ 同步状态并加载
watch(
  () => route.query,
  (q) => {
    if (route.path !== '/dishes') return
    categoryId.value = q.categoryId ? String(q.categoryId) : ''
    keyword.value = q.keyword ? String(q.keyword) : ''
    page.value = Number(q.page) > 0 ? Number(q.page) : 1
    searchInput.value = keyword.value
    loadDishes()
  },
  { immediate: true }
)

onMounted(async () => {
  try {
    categories.value = (await categoryApi.list()) || []
  } catch (e) {
    // 分类加载失败不阻塞菜品展示
  }
})
</script>

<template>
  <div class="container page-main">
    <div class="dishes-layout">
      <!-- 左侧分类侧栏 -->
      <aside class="category-side">
        <a :class="{ active: categoryId === '' }" @click="onCategory('')">全部分类</a>
        <a
          v-for="c in categories"
          :key="c.id"
          :class="{ active: String(c.id) === categoryId }"
          @click="onCategory(String(c.id))"
        >
          {{ c.name }}
        </a>
      </aside>

      <!-- 右侧内容区 -->
      <div class="dishes-content">
        <!-- 搜索框 -->
        <div class="search-bar">
          <el-input
            v-model="searchInput"
            placeholder="输入菜品名称搜索..."
            clearable
            @keyup.enter="doSearch"
          />
          <el-button type="primary" @click="doSearch">搜索</el-button>
          <el-button @click="doReset">重置</el-button>
        </div>

        <!-- 菜品网格 -->
        <div v-loading="loading" class="dish-grid">
          <el-empty
            v-if="!loading && dishes.length === 0"
            description="没有找到相关菜品"
            style="grid-column: 1 / -1"
          />
          <DishCard v-for="d in dishes" :key="d.id" :dish="d" />
        </div>

        <!-- 分页 -->
        <div v-if="total > 0" class="pagination-wrap">
          <el-pagination
            layout="prev, pager, next, total"
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            background
            @current-change="onPageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dishes-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.category-side {
  width: 170px;
  flex-shrink: 0;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  position: sticky;
  top: 76px;
}

.category-side a {
  display: block;
  padding: 13px 18px;
  font-size: 14px;
  border-left: 3px solid transparent;
  color: var(--text-main);
  cursor: pointer;
}

.category-side a:hover {
  color: var(--primary);
  background: #fffaf5;
}

.category-side a.active {
  color: var(--primary);
  background: var(--primary-light);
  border-left-color: var(--primary);
  font-weight: bold;
}

.dishes-content {
  flex: 1;
  min-width: 0;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.search-bar .el-input {
  flex: 1;
}

.search-bar .el-button + .el-button {
  margin-left: 0;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  min-height: 200px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 900px) {
  .category-side {
    display: none;
  }

  .dish-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
