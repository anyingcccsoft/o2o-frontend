<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import * as userApi from '../api/user'
import { useUserStore } from '../stores/user'
import { formatTime } from '../utils/format'

const router = useRouter()
const userStore = useUserStore()

const info = ref(null)
const infoForm = reactive({ nickname: '', phone: '' })
const pwdForm = reactive({ oldPassword: '', newPassword: '', newPassword2: '' })
const savingInfo = ref(false)
const savingPwd = ref(false)

async function loadInfo() {
  try {
    const u = await userApi.getInfo()
    info.value = u
    infoForm.nickname = u?.nickname || ''
    infoForm.phone = u?.phone || ''
    // 同步 store，保持导航栏昵称一致
    userStore.setInfo(u)
  } catch (e) {
    // 401 拦截器已自动跳登录
  }
}

async function saveInfo() {
  const nickname = infoForm.nickname.trim()
  const phone = infoForm.phone.trim()
  if (!nickname) {
    ElMessage.error('请输入昵称')
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    ElMessage.error('手机号格式不正确')
    return
  }
  savingInfo.value = true
  try {
    await userApi.updateInfo({ nickname, phone })
    ElMessage.success('修改成功')
    await loadInfo()
  } catch (e) {
    // 业务失败拦截器已统一提示
  } finally {
    savingInfo.value = false
  }
}

async function savePassword() {
  if (!pwdForm.oldPassword) {
    ElMessage.error('请输入原密码')
    return
  }
  if (pwdForm.newPassword.length < 6) {
    ElMessage.error('新密码长度不能少于 6 位')
    return
  }
  if (pwdForm.newPassword !== pwdForm.newPassword2) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }
  savingPwd.value = true
  try {
    await userApi.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    })
    ElMessage.success('密码修改成功，请重新登录')
    // 改密成功后强制登出并跳登录页
    await userStore.logout()
    router.push('/login')
  } catch (e) {
    // 业务失败拦截器已统一提示
  } finally {
    savingPwd.value = false
  }
}

onMounted(loadInfo)
</script>

<template>
  <div class="container page-main">
    <div class="profile-layout">
      <!-- 左侧：头像与入口链接 -->
      <aside class="profile-side">
        <el-card shadow="never" :body-style="{ padding: '0' }">
          <div class="profile-avatar">
            <div class="avatar">👤</div>
            <div class="p-name">{{ info?.nickname || info?.username || '-' }}</div>
            <div class="p-sub">注册于 {{ formatTime(info?.createdAt) || '-' }}</div>
          </div>
          <nav class="profile-menu">
            <router-link to="/orders">📋 我的订单</router-link>
            <router-link to="/address">📍 地址管理</router-link>
            <router-link to="/cart">🛒 我的购物车</router-link>
          </nav>
        </el-card>
      </aside>

      <!-- 右侧：信息编辑与改密 -->
      <div class="profile-content">
        <!-- 基本信息 -->
        <el-card shadow="never">
          <div class="card-title">基本信息</div>
          <el-form label-position="top" class="profile-form" @submit.prevent>
            <el-form-item label="用户名（不可修改）">
              <el-input :model-value="info?.username || ''" disabled />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="infoForm.nickname" maxlength="20" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="infoForm.phone" maxlength="11" placeholder="请输入 11 位手机号" />
            </el-form-item>
            <el-button type="primary" :loading="savingInfo" @click="saveInfo">保存修改</el-button>
          </el-form>
        </el-card>

        <!-- 修改密码 -->
        <el-card shadow="never" class="mt-20">
          <div class="card-title">修改密码</div>
          <el-form label-position="top" class="profile-form" @submit.prevent>
            <el-form-item label="原密码">
              <el-input
                v-model="pwdForm.oldPassword"
                type="password"
                show-password
                maxlength="32"
                placeholder="请输入原密码"
              />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input
                v-model="pwdForm.newPassword"
                type="password"
                show-password
                maxlength="32"
                placeholder="6-32 位新密码"
              />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input
                v-model="pwdForm.newPassword2"
                type="password"
                show-password
                maxlength="32"
                placeholder="请再次输入新密码"
                @keyup.enter="savePassword"
              />
            </el-form-item>
            <el-button type="primary" :loading="savingPwd" @click="savePassword">修改密码</el-button>
            <p class="text-sub fs-12 mt-10">修改成功后需要重新登录</p>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.profile-side {
  width: 220px;
  flex-shrink: 0;
}

.profile-avatar {
  text-align: center;
  padding: 26px 16px 20px;
}

.profile-avatar .avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
}

.profile-avatar .p-name {
  font-weight: bold;
  font-size: 16px;
}

.profile-avatar .p-sub {
  color: var(--text-sub);
  font-size: 12px;
  margin-top: 4px;
}

.profile-menu a {
  display: block;
  padding: 12px 20px;
  border-left: 3px solid transparent;
  color: var(--text-main);
  font-size: 14px;
}

.profile-menu a:hover {
  color: var(--primary);
  background: #fffaf5;
}

.profile-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 14px;
}

.profile-form {
  max-width: 420px;
}

@media (max-width: 768px) {
  .profile-layout {
    flex-direction: column;
  }

  .profile-side {
    width: 100%;
  }
}
</style>
