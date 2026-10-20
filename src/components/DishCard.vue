<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { formatMoney, imgUrl } from '../utils/format'

const props = defineProps({
  dish: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const cartStore = useCartStore()

// 下架（status=0）或无库存时禁用加购
const disabled = computed(() => props.dish.status === 0 || props.dish.stock <= 0)

function goDetail() {
  router.push(`/dishes/${props.dish.id}`)
}

function onAdd() {
  cartStore.addToCart(props.dish.id, 1)
}
</script>

<template>
  <el-card class="dish-card" shadow="hover" :body-style="{ padding: '0' }" @click="goDetail">
    <img class="dish-img" :src="imgUrl(dish.imageUrl)" :alt="dish.name" />
    <div class="dish-body">
      <div class="dish-name" :title="dish.name">{{ dish.name }}</div>
      <div class="dish-desc" :title="dish.description">{{ dish.description || '暂无描述' }}</div>
      <div class="flex-between mt-10">
        <span class="price">{{ formatMoney(dish.price) }}</span>
        <span class="text-sub fs-12">月售 {{ dish.sales || 0 }}</span>
      </div>
      <div class="flex-between mt-10">
        <span v-if="disabled" class="text-sub fs-12">{{ dish.status === 0 ? '已下架' : '已售罄' }}</span>
        <span v-else class="text-sub fs-12">库存 {{ dish.stock }}</span>
        <el-button type="primary" size="small" :disabled="disabled" @click.stop="onAdd">
          + 加购
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.dish-card {
  cursor: pointer;
  border-radius: var(--radius);
  overflow: hidden;
}

.dish-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.dish-body {
  padding: 12px;
}

.dish-name {
  font-size: 16px;
  font-weight: bold;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dish-desc {
  color: var(--text-sub);
  font-size: 12px;
  margin-top: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
