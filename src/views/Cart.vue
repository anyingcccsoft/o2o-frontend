<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import * as cartApi from '../api/cart'
import { useCartStore } from '../stores/cart'
import { formatMoney, imgUrl } from '../utils/format'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const items = ref([])

// 可结算项（排除已停售）
const validItems = computed(() => items.value.filter((i) => i.dishStatus === 1))
const invalidCount = computed(() => items.value.length - validItems.value.length)

// 合计按分累加，避免浮点误差
const totalAmount = computed(
  () =>
    validItems.value.reduce(
      (sum, i) => sum + Math.round(Number(i.price) * 100) * i.quantity,
      0
    ) / 100
)
const totalCount = computed(() => validItems.value.reduce((s, i) => s + i.quantity, 0))

async function load() {
  loading.value = true
  try {
    items.value = (await cartApi.list()) || []
  } finally {
    loading.value = false
  }
}

async function onQuantityChange(item, quantity) {
  // el-input-number 清空输入可能传 null/undefined，非法值不发请求，直接回滚到服务端值
  if (!Number.isInteger(quantity) || quantity <= 0) {
    await load()
    return
  }
  try {
    await cartApi.update(item.id, { quantity })
  } finally {
    // 失败时也重载，使数量控件回退到服务端真实值
    await load()
    cartStore.refresh()
  }
}

async function onRemove(item) {
  await ElMessageBox.confirm(`确定将「${item.dishName}」移出购物车吗？`, '删除商品', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await cartApi.remove(item.id)
  ElMessage.success('已删除')
  await load()
  cartStore.refresh()
}

async function onClear() {
  await ElMessageBox.confirm('确定清空购物车吗？', '清空购物车', {
    confirmButtonText: '清空',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await cartApi.clear()
  ElMessage.success('购物车已清空')
  await load()
  cartStore.refresh()
}

function goCheckout() {
  if (validItems.value.length === 0) {
    ElMessage.warning('购物车中没有可结算的商品')
    return
  }
  if (invalidCount.value > 0) {
    ElMessage.warning('已停售商品不参与结算')
  }
  router.push('/order-confirm')
}

onMounted(load)
</script>

<template>
  <div class="container page-main">
    <div class="flex-between mb-10">
      <h2>购物车</h2>
      <el-button v-if="items.length" text type="danger" @click="onClear">清空购物车</el-button>
    </div>

    <el-card v-loading="loading" shadow="never">
      <el-empty v-if="!loading && items.length === 0" description="购物车空空如也">
        <el-button type="primary" @click="router.push('/dishes')">去逛逛菜品</el-button>
      </el-empty>

      <template v-else>
        <el-table :data="items" style="width: 100%">
          <el-table-column label="商品" min-width="260">
            <template #default="{ row }">
              <div class="goods-cell">
                <img class="goods-img" :src="imgUrl(row.dishImage)" :alt="row.dishName" />
                <div>
                  <div class="goods-name">{{ row.dishName }}</div>
                  <el-tag v-if="row.dishStatus === 0" type="danger" size="small" class="mt-10">
                    已停售
                  </el-tag>
                  <div v-else class="text-sub fs-12 mt-10">库存 {{ row.stock }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="110">
            <template #default="{ row }">
              <span class="price-small">{{ formatMoney(row.price) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="170">
            <template #default="{ row }">
              <el-input-number
                :model-value="row.quantity"
                :min="1"
                :max="row.stock > 0 ? row.stock : 1"
                :disabled="row.dishStatus === 0"
                @change="(val) => onQuantityChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="110">
            <template #default="{ row }">
              <span class="price-small">
                {{ formatMoney((Math.round(Number(row.price) * 100) * row.quantity) / 100) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row }">
              <el-button text type="danger" @click="onRemove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="checkout-bar">
          <span v-if="invalidCount > 0" class="text-sub fs-12">
            {{ invalidCount }} 件已停售商品不参与结算
          </span>
          <span>
            共 <b>{{ totalCount }}</b> 件商品，合计：
            <span class="price">{{ formatMoney(totalAmount) }}</span>
          </span>
          <el-button
            type="primary"
            size="large"
            :disabled="validItems.length === 0"
            @click="goCheckout"
          >
            去结算
          </el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.goods-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.goods-img {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--primary-light);
  flex-shrink: 0;
}

.goods-name {
  font-size: 15px;
  font-weight: bold;
}

.checkout-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  padding-top: 16px;
}
</style>
