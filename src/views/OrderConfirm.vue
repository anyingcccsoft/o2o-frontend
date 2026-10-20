<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import * as addressApi from '../api/address'
import * as cartApi from '../api/cart'
import * as orderApi from '../api/order'
import { useCartStore } from '../stores/cart'
import { formatMoney, imgUrl, PAY_METHOD_TEXT } from '../utils/format'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const addresses = ref([])
const selectedAddrId = ref(null)
const payMethod = ref(1)
const remark = ref('')
const submitting = ref(false)

// 仅在售商品参与结算
const cartItems = ref([])
const totalAmount = computed(
  () =>
    cartItems.value.reduce(
      (sum, i) => sum + Math.round(Number(i.price) * 100) * i.quantity,
      0
    ) / 100
)

const canSubmit = computed(() => !!selectedAddrId.value && cartItems.value.length > 0)

async function load() {
  loading.value = true
  try {
    const [addrList, items] = await Promise.all([addressApi.list(), cartApi.list()])
    addresses.value = addrList || []
    cartItems.value = (items || []).filter((i) => i.dishStatus === 1)
    // 默认选中 isDefault=1 的地址，没有则选第一条
    const def = addresses.value.find((a) => a.isDefault === 1) || addresses.value[0]
    selectedAddrId.value = def ? def.id : null
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!selectedAddrId.value) {
    ElMessage.warning('请先选择收货地址')
    return
  }
  submitting.value = true
  try {
    const order = await orderApi.create({
      addressId: selectedAddrId.value,
      payMethod: payMethod.value,
      remark: remark.value.trim(),
    })
    // 下单后购物车已清空，同步角标
    cartStore.refresh()
    // 模拟支付确认：立即支付或稍后去订单列表支付
    try {
      await ElMessageBox.confirm(
        `订单提交成功！订单号：${order.orderNo}，应付金额 ${formatMoney(order.totalAmount)}。是否立即完成模拟支付？`,
        '模拟支付',
        { confirmButtonText: '确认支付', cancelButtonText: '暂不支付', type: 'info' }
      )
      await orderApi.pay(order.id)
      ElMessage.success('支付成功')
    } catch (e) {
      // 暂不支付：订单已生成，去详情可继续支付
    }
    router.push(`/orders/${order.id}`)
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="container page-main" v-loading="loading">
    <h2 class="mb-10">确认订单</h2>

    <!-- 收货地址 -->
    <el-card shadow="never" class="mb-10">
      <template #header>
        <div class="flex-between">
          <span>收货地址</span>
          <el-button text type="primary" @click="router.push('/address')">管理 / 新增地址</el-button>
        </div>
      </template>
      <el-empty v-if="!loading && addresses.length === 0" description="还没有收货地址">
        <el-button type="primary" @click="router.push('/address')">去新增地址</el-button>
      </el-empty>
      <div v-else class="addr-list">
        <div
          v-for="a in addresses"
          :key="a.id"
          class="addr-item"
          :class="{ selected: a.id === selectedAddrId }"
          @click="selectedAddrId = a.id"
        >
          <div class="addr-head">
            {{ a.consignee }} {{ a.phone }}
            <el-tag v-if="a.isDefault === 1" type="warning" size="small">默认</el-tag>
          </div>
          <div class="addr-detail">{{ (a.region || '') + ' ' + a.detail }}</div>
        </div>
      </div>
    </el-card>

    <!-- 支付方式 -->
    <el-card shadow="never" class="mb-10">
      <template #header>支付方式</template>
      <el-radio-group v-model="payMethod">
        <el-radio-button v-for="(text, val) in PAY_METHOD_TEXT" :key="val" :value="Number(val)">
          {{ text }}
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 订单备注 -->
    <el-card shadow="never" class="mb-10">
      <template #header>订单备注</template>
      <el-input
        v-model="remark"
        type="textarea"
        :rows="2"
        maxlength="200"
        show-word-limit
        placeholder="口味偏好、送达时间等要求（选填）"
      />
    </el-card>

    <!-- 商品清单 -->
    <el-card shadow="never" class="mb-10">
      <template #header>商品清单</template>
      <el-empty v-if="!loading && cartItems.length === 0" description="购物车为空，无法结算">
        <el-button type="primary" @click="router.push('/dishes')">去逛逛菜品</el-button>
      </el-empty>
      <template v-else>
        <div v-for="item in cartItems" :key="item.id" class="confirm-item">
          <img :src="imgUrl(item.dishImage)" :alt="item.dishName" />
          <span class="ci-name">{{ item.dishName }}</span>
          <span class="text-sub">×{{ item.quantity }}</span>
          <span class="ci-sub price-small">
            {{ formatMoney((Math.round(Number(item.price) * 100) * item.quantity) / 100) }}
          </span>
        </div>
      </template>
    </el-card>

    <!-- 提交 -->
    <el-card shadow="never">
      <div class="submit-bar">
        <span>合计：<span class="price total-price">{{ formatMoney(totalAmount) }}</span></span>
        <el-button
          type="primary"
          size="large"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="onSubmit"
        >
          提交订单
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.addr-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.addr-item {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.addr-item:hover {
  border-color: var(--primary);
}

.addr-item.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.addr-head {
  font-weight: bold;
  margin-bottom: 4px;
}

.addr-detail {
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.6;
}

.confirm-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
}

.confirm-item:last-child {
  border-bottom: none;
}

.confirm-item img {
  width: 52px;
  height: 52px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--primary-light);
}

.ci-name {
  flex: 1;
}

.ci-sub {
  width: 90px;
  text-align: right;
}

.submit-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}

.total-price {
  font-size: 26px;
}

@media (max-width: 640px) {
  .addr-list {
    grid-template-columns: 1fr;
  }
}
</style>
