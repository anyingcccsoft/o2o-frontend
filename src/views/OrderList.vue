<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import * as orderApi from '../api/order'
import {
  formatMoney,
  formatTime,
  ORDER_STATUS_TEXT,
  ORDER_STATUS_TYPE,
  PAY_METHOD_TEXT,
  PAY_STATUS_TEXT,
} from '../utils/format'

const router = useRouter()

const loading = ref(false)
const records = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
// 防重复提交：记录正在支付/取消操作的订单 id
const actingId = ref(null)

async function load() {
  loading.value = true
  try {
    const res = await orderApi.list({ page: page.value, pageSize: pageSize.value })
    records.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function onPageChange(p) {
  page.value = p
  load()
}

function canPay(o) {
  return o.payStatus === 0 && o.orderStatus !== 4
}

function canCancel(o) {
  return o.orderStatus === 0 || o.orderStatus === 1
}

async function onPay(o) {
  if (actingId.value !== null) return
  try {
    await ElMessageBox.confirm(
      `应付金额 ${formatMoney(o.totalAmount)}，确认完成模拟支付吗？`,
      '模拟支付',
      { confirmButtonText: '确认支付', cancelButtonText: '取消', type: 'info' }
    )
  } catch (e) {
    return // 用户取消确认框，不视为错误
  }
  actingId.value = o.id
  try {
    await orderApi.pay(o.id)
    ElMessage.success('支付成功')
    load()
  } finally {
    actingId.value = null
  }
}

async function onCancel(o) {
  if (actingId.value !== null) return
  try {
    await ElMessageBox.confirm('确定取消该订单吗？库存将自动回补。', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
      type: 'warning',
    })
  } catch (e) {
    return // 用户取消确认框，不视为错误
  }
  actingId.value = o.id
  try {
    await orderApi.cancel(o.id)
    ElMessage.success('订单已取消')
    load()
  } finally {
    actingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="container page-main">
    <h2 class="mb-10">我的订单</h2>

    <el-card v-loading="loading" shadow="never">
      <el-empty v-if="!loading && records.length === 0" description="还没有订单">
        <el-button type="primary" @click="router.push('/dishes')">去逛逛菜品</el-button>
      </el-empty>

      <template v-else>
        <el-table :data="records" style="width: 100%">
          <el-table-column prop="orderNo" label="订单号" min-width="170" />
          <el-table-column label="下单时间" width="150">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="金额" width="100">
            <template #default="{ row }">
              <span class="price-small">{{ formatMoney(row.totalAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="支付方式" width="100">
            <template #default="{ row }">{{ PAY_METHOD_TEXT[row.payMethod] || '-' }}</template>
          </el-table-column>
          <el-table-column label="支付状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.payStatus === 1 ? 'success' : 'warning'" size="small">
                {{ PAY_STATUS_TEXT[row.payStatus] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="订单状态" width="90">
            <template #default="{ row }">
              <el-tag :type="ORDER_STATUS_TYPE[row.orderStatus]" size="small">
                {{ ORDER_STATUS_TEXT[row.orderStatus] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="canPay(row)"
                type="primary"
                size="small"
                :loading="actingId === row.id"
                :disabled="actingId !== null"
                @click="onPay(row)"
              >
                去支付
              </el-button>
              <el-button
                v-if="canCancel(row)"
                size="small"
                :loading="actingId === row.id"
                :disabled="actingId !== null"
                @click="onCancel(row)"
              >
                取消
              </el-button>
              <el-button text type="primary" size="small" @click="router.push(`/orders/${row.id}`)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="flex-center mt-20">
          <el-pagination
            layout="prev, pager, next, total"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            @current-change="onPageChange"
          />
        </div>
      </template>
    </el-card>
  </div>
</template>
