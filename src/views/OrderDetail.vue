<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import * as orderApi from '../api/order'
import {
  formatMoney,
  formatTime,
  imgUrl,
  ORDER_STATUS_TEXT,
  ORDER_STATUS_TYPE,
  PAY_METHOD_TEXT,
  PAY_STATUS_TEXT,
} from '../utils/format'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const notFound = ref(false)
const order = ref(null)
// 防重复提交：支付/取消请求进行中标志
const paying = ref(false)
const canceling = ref(false)

const itemCount = computed(() =>
  ((order.value && order.value.items) || []).reduce((s, i) => s + (i.quantity || 0), 0)
)

const canPay = computed(
  () => order.value && order.value.payStatus === 0 && order.value.orderStatus !== 4
)
const canCancel = computed(
  () => order.value && (order.value.orderStatus === 0 || order.value.orderStatus === 1)
)

async function load() {
  loading.value = true
  try {
    order.value = await orderApi.detail(route.params.id)
    notFound.value = !order.value
  } catch (e) {
    if (e.code !== 401) notFound.value = true
  } finally {
    loading.value = false
  }
}

async function onPay() {
  if (paying.value || canceling.value) return
  try {
    await ElMessageBox.confirm(
      `应付金额 ${formatMoney(order.value.totalAmount)}，确认完成模拟支付吗？`,
      '模拟支付',
      { confirmButtonText: '确认支付', cancelButtonText: '取消', type: 'info' }
    )
  } catch (e) {
    return // 用户取消确认框，不视为错误
  }
  paying.value = true
  try {
    await orderApi.pay(order.value.id)
    ElMessage.success('支付成功')
    load()
  } finally {
    paying.value = false
  }
}

async function onCancel() {
  if (paying.value || canceling.value) return
  try {
    await ElMessageBox.confirm('确定取消该订单吗？库存将自动回补。', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
      type: 'warning',
    })
  } catch (e) {
    return // 用户取消确认框，不视为错误
  }
  canceling.value = true
  try {
    await orderApi.cancel(order.value.id)
    ElMessage.success('订单已取消')
    load()
  } finally {
    canceling.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="container page-main" v-loading="loading">
    <el-card v-if="notFound" shadow="never">
      <el-empty description="订单不存在">
        <el-button type="primary" @click="router.push('/orders')">返回订单列表</el-button>
      </el-empty>
    </el-card>

    <template v-else-if="order">
      <!-- 状态卡片 -->
      <el-card shadow="never" class="mb-10">
        <template #header>
          <div class="flex-between">
            <span>订单状态</span>
            <el-tag :type="ORDER_STATUS_TYPE[order.orderStatus]">
              {{ ORDER_STATUS_TEXT[order.orderStatus] || '-' }}
            </el-tag>
          </div>
        </template>
        <!-- 已取消单独展示，否则渲染进度条 -->
        <div v-if="order.orderStatus === 4" class="cancel-banner">
          订单已取消{{ order.payStatus === 1 ? '（已支付金额将原路退回 - 模拟）' : '' }}
        </div>
        <template v-else>
          <el-steps :active="order.orderStatus + 1" align-center finish-status="success">
            <el-step title="待接单" />
            <el-step title="制作中" />
            <el-step title="配送中" />
            <el-step title="已完成" />
          </el-steps>
          <p v-if="order.payStatus === 0" class="text-center text-sub fs-12 mt-10">
            当前订单待支付，请尽快完成支付
          </p>
        </template>
      </el-card>

      <!-- 订单信息卡片 -->
      <el-card shadow="never" class="mb-10">
        <template #header>订单信息</template>
        <div class="info-row"><span class="label">订单号</span><span>{{ order.orderNo }}</span></div>
        <div class="info-row"><span class="label">下单时间</span><span>{{ formatTime(order.createdAt) }}</span></div>
        <div v-if="order.completedAt" class="info-row">
          <span class="label">完成时间</span><span>{{ formatTime(order.completedAt) }}</span>
        </div>
        <div class="info-row"><span class="label">支付方式</span><span>{{ PAY_METHOD_TEXT[order.payMethod] || '-' }}</span></div>
        <div class="info-row"><span class="label">支付状态</span><span>{{ PAY_STATUS_TEXT[order.payStatus] || '-' }}</span></div>
        <div class="info-row"><span class="label">收货信息</span><span>{{ order.addressSnapshot || '-' }}</span></div>
        <div class="info-row"><span class="label">订单备注</span><span>{{ order.remark || '无' }}</span></div>
      </el-card>

      <!-- 商品明细卡片 -->
      <el-card shadow="never" class="mb-10">
        <template #header>商品明细</template>
        <div v-for="item in order.items || []" :key="item.id" class="oi-item">
          <img :src="imgUrl(item.dishImage)" :alt="item.dishName" />
          <span class="oi-name">{{ item.dishName }}</span>
          <span class="oi-price text-sub">{{ formatMoney(item.price) }} × {{ item.quantity }}</span>
          <span class="oi-sub price-small">{{ formatMoney(item.subtotal) }}</span>
        </div>
        <div class="amount-box">
          共 {{ itemCount }} 件商品，合计：
          <span class="price amount-price">{{ formatMoney(order.totalAmount) }}</span>
        </div>
      </el-card>

      <!-- 操作区 -->
      <el-card v-if="canPay || canCancel" shadow="never" class="mb-10">
        <div class="detail-actions">
          <el-button v-if="canPay" type="primary" :loading="paying" :disabled="canceling" @click="onPay">去支付</el-button>
          <el-button v-if="canCancel" :loading="canceling" :disabled="paying" @click="onCancel">取消订单</el-button>
        </div>
      </el-card>

      <div class="text-center mt-10">
        <el-button text @click="router.push('/orders')">← 返回订单列表</el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cancel-banner {
  background: #f0f0f0;
  color: var(--text-sub);
  border-radius: var(--radius);
  padding: 18px;
  text-align: center;
  font-size: 15px;
}

.info-row {
  display: flex;
  padding: 6px 0;
  font-size: 14px;
}

.info-row .label {
  width: 90px;
  color: var(--text-sub);
  flex-shrink: 0;
}

.oi-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
}

.oi-item:last-of-type {
  border-bottom: none;
}

.oi-item img {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--primary-light);
}

.oi-name {
  flex: 1;
}

.oi-price {
  width: 110px;
  text-align: center;
}

.oi-sub {
  width: 90px;
  text-align: right;
}

.amount-box {
  text-align: right;
  padding-top: 12px;
  font-size: 14px;
}

.amount-price {
  font-size: 24px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
