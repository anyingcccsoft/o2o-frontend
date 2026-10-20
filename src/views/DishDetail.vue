<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as dishApi from '../api/dish'
import { useCartStore } from '../stores/cart'
import { formatMoney, imgUrl } from '../utils/format'

const route = useRoute()
const cartStore = useCartStore()

const dish = ref(null)
const loading = ref(true)
const loadFailed = ref(false)
const quantity = ref(1)
const adding = ref(false)

// 下架（status=0）或无库存时禁用加购
const disabled = computed(() => !dish.value || dish.value.status === 0 || dish.value.stock <= 0)
const maxQty = computed(() => Math.max(1, dish.value?.stock || 1))

async function loadDetail(id) {
  loading.value = true
  loadFailed.value = false
  try {
    dish.value = await dishApi.detail(id)
    quantity.value = 1
  } catch (e) {
    dish.value = null
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

async function onAdd() {
  if (disabled.value) return
  adding.value = true
  try {
    await cartStore.addToCart(dish.value.id, quantity.value)
  } catch (e) {
    // 401 / 业务失败拦截器已统一处理
  } finally {
    adding.value = false
  }
}

// 支持在详情页间跳转（如推荐位）时按 id 重新加载
watch(
  () => route.params.id,
  (id) => {
    if (id && route.name === 'dish-detail') loadDetail(id)
  }
)

onMounted(() => loadDetail(route.params.id))
</script>

<template>
  <div class="container page-main">
    <el-breadcrumb separator="/" class="mb-10">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/dishes' }">全部菜品</el-breadcrumb-item>
      <el-breadcrumb-item>{{ dish?.name || '菜品详情' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card v-loading="loading" shadow="never" class="detail-card">
      <!-- 加载失败 / 菜品不存在 -->
      <el-empty v-if="loadFailed" description="菜品不存在或已下架">
        <el-button type="primary" @click="$router.push('/dishes')">去逛逛其他菜品</el-button>
      </el-empty>

      <!-- 详情内容 -->
      <div v-else-if="dish" class="detail-layout">
        <img class="detail-img" :src="imgUrl(dish.imageUrl)" :alt="dish.name" />
        <div class="detail-info">
          <div class="detail-name">{{ dish.name }}</div>
          <div class="detail-desc">{{ dish.description || '暂无描述' }}</div>
          <div class="detail-meta">
            <span>月售 {{ dish.sales || 0 }} 份</span>
            <span>库存 {{ dish.stock || 0 }} 份</span>
            <el-tag v-if="dish.status === 0" type="info" size="small">已下架</el-tag>
            <el-tag v-else-if="dish.stock <= 0" type="danger" size="small">已售罄</el-tag>
            <el-tag v-else type="success" size="small">有货</el-tag>
          </div>
          <div class="detail-price">{{ formatMoney(dish.price) }}</div>
          <div class="detail-actions">
            <span class="text-sub">数量</span>
            <el-input-number
              v-model="quantity"
              :min="1"
              :max="maxQty"
              :disabled="disabled"
            />
            <el-button
              type="primary"
              size="large"
              :disabled="disabled"
              :loading="adding"
              @click="onAdd"
            >
              {{ dish.status === 0 ? '已下架' : dish.stock <= 0 ? '已售罄' : '🛒 加入购物车' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.detail-card {
  min-height: 300px;
}

.detail-layout {
  display: flex;
  gap: 30px;
}

.detail-img {
  width: 420px;
  height: 320px;
  object-fit: cover;
  border-radius: var(--radius);
  background: var(--primary-light);
  flex-shrink: 0;
}

.detail-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.detail-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.detail-desc {
  color: var(--text-sub);
  line-height: 1.8;
  margin-bottom: 14px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  color: var(--text-sub);
  font-size: 13px;
  margin-bottom: 18px;
}

.detail-price {
  font-size: 30px;
  color: var(--danger);
  font-weight: bold;
  margin-bottom: 22px;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: auto;
}

@media (max-width: 768px) {
  .detail-layout {
    flex-direction: column;
  }

  .detail-img {
    width: 100%;
    height: 240px;
  }
}
</style>
