<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import * as addressApi from '../api/address'

const loading = ref(false)
const addresses = ref([])

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const form = reactive({
  consignee: '',
  phone: '',
  region: '',
  detail: '',
  isDefault: 0,
})

const rules = {
  consignee: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  region: [{ required: true, message: '请输入所在地区', trigger: 'blur' }],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
}

async function load() {
  loading.value = true
  try {
    addresses.value = (await addressApi.list()) || []
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingId.value = null
  Object.assign(form, { consignee: '', phone: '', region: '', detail: '', isDefault: 0 })
  dialogVisible.value = true
}

function openEdit(a) {
  editingId.value = a.id
  Object.assign(form, {
    consignee: a.consignee,
    phone: a.phone,
    region: a.region,
    detail: a.detail,
    isDefault: a.isDefault,
  })
  dialogVisible.value = true
}

async function onSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    const data = { ...form }
    if (editingId.value) {
      await addressApi.update(editingId.value, data)
      ElMessage.success('地址已更新')
    } else {
      await addressApi.add(data)
      ElMessage.success('地址已添加')
    }
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function onRemove(a) {
  await ElMessageBox.confirm(`确定删除「${a.consignee}」的这条地址吗？`, '删除地址', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await addressApi.remove(a.id)
  ElMessage.success('已删除')
  load()
}

async function onSetDefault(a) {
  await addressApi.setDefault(a.id)
  ElMessage.success('已设为默认地址')
  load()
}

onMounted(load)
</script>

<template>
  <div class="container page-main">
    <div class="flex-between mb-10">
      <h2>收货地址</h2>
      <el-button type="primary" @click="openAdd">+ 新增地址</el-button>
    </div>

    <el-card v-loading="loading" shadow="never">
      <el-empty v-if="!loading && addresses.length === 0" description="还没有收货地址">
        <el-button type="primary" @click="openAdd">新增第一条地址</el-button>
      </el-empty>

      <div v-else class="addr-list">
        <div v-for="a in addresses" :key="a.id" class="addr-item">
          <div class="addr-head">
            {{ a.consignee }} {{ a.phone }}
            <el-tag v-if="a.isDefault === 1" type="warning" size="small">默认</el-tag>
          </div>
          <div class="addr-detail">{{ (a.region || '') + ' ' + a.detail }}</div>
          <div class="addr-actions">
            <el-button v-if="a.isDefault !== 1" text type="primary" size="small" @click="onSetDefault(a)">
              设为默认
            </el-button>
            <el-button text size="small" @click="openEdit(a)">编辑</el-button>
            <el-button text type="danger" size="small" @click="onRemove(a)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑地址' : '新增地址'"
      width="480px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="收货人" prop="consignee">
          <el-input v-model="form.consignee" maxlength="20" placeholder="收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="11 位手机号" />
        </el-form-item>
        <el-form-item label="所在地区" prop="region">
          <el-input v-model="form.region" maxlength="50" placeholder="如：上海市宝山区" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail">
          <el-input
            v-model="form.detail"
            type="textarea"
            :rows="2"
            maxlength="100"
            placeholder="街道、楼栋、门牌号等"
          />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
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

.addr-actions {
  margin-top: 8px;
  text-align: right;
}

@media (max-width: 640px) {
  .addr-list {
    grid-template-columns: 1fr;
  }
}
</style>
