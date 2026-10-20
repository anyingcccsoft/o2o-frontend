<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import * as userApi from '../api/user'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const activeTab = ref('login')
const loginLoading = ref(false)
const regLoading = ref(false)

const loginForm = reactive({ username: '', password: '' })
const regForm = reactive({ username: '', phone: '', password: '', password2: '' })

async function doLogin() {
  const username = loginForm.username.trim()
  if (!username || !loginForm.password) {
    ElMessage.error('请输入用户名和密码')
    return
  }
  loginLoading.value = true
  try {
    const user = await userApi.login({ username, password: loginForm.password })
    userStore.setInfo(user)
    cartStore.refresh()
    ElMessage.success('登录成功')
    // 支持 ?redirect= 参数登录成功后跳回
    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' && redirect ? redirect : '/')
  } catch (e) {
    // 业务失败拦截器已统一提示
  } finally {
    loginLoading.value = false
  }
}

async function doRegister() {
  const username = regForm.username.trim()
  const phone = regForm.phone.trim()
  if (!username || !phone || !regForm.password) {
    ElMessage.error('请填写完整注册信息')
    return
  }
  if (username.length < 3) {
    ElMessage.error('用户名长度不能少于 3 位')
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    ElMessage.error('手机号格式不正确')
    return
  }
  if (regForm.password.length < 6) {
    ElMessage.error('密码长度不能少于 6 位')
    return
  }
  if (regForm.password !== regForm.password2) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  regLoading.value = true
  try {
    await userApi.register({ username, phone, password: regForm.password })
    ElMessage.success('注册成功，请登录')
    // 注册成功自动切到登录 Tab 并回填用户名
    activeTab.value = 'login'
    loginForm.username = username
    loginForm.password = ''
  } catch (e) {
    // 业务失败拦截器已统一提示
  } finally {
    regLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">🍜 上大外卖</div>
      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="登录" name="login">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="用户名 / 手机号">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名或手机号"
                maxlength="32"
                @keyup.enter="doLogin"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                show-password
                placeholder="请输入密码"
                maxlength="32"
                @keyup.enter="doLogin"
              />
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              class="btn-block"
              :loading="loginLoading"
              @click="doLogin"
            >
              登 录
            </el-button>
            <div class="login-tip">测试账号：test / 123456</div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="用户名">
              <el-input v-model="regForm.username" placeholder="3-32 位字母或数字" maxlength="32" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="regForm.phone" placeholder="请输入 11 位手机号" maxlength="11" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="regForm.password"
                type="password"
                show-password
                placeholder="6-32 位密码"
                maxlength="32"
              />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input
                v-model="regForm.password2"
                type="password"
                show-password
                placeholder="请再次输入密码"
                maxlength="32"
                @keyup.enter="doRegister"
              />
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              class="btn-block"
              :loading="regLoading"
              @click="doRegister"
            >
              注 册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
    <router-link to="/" class="back-home">← 返回首页逛逛</router-link>
  </div>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #ff8c42 0%, #ff6600 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.login-card {
  width: 380px;
  max-width: 92vw;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.18);
  padding: 30px 34px 34px;
}

.login-logo {
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 14px;
}

.btn-block {
  width: 100%;
}

.login-tip {
  text-align: center;
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-sub);
}

.back-home {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.back-home:hover {
  color: #fff;
  text-decoration: underline;
}
</style>
