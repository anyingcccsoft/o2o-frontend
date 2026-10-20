import axios from 'axios'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

/**
 * axios 实例：真实跨域直连后端，携带 Cookie（JSESSIONID）
 * 后端统一响应格式 {code, msg, data}：1 成功 / 0 失败 / 401 未登录
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE + '/api',
  withCredentials: true,
  timeout: 10000,
})

request.interceptors.response.use(
  async (response) => {
    const res = response.data
    if (res.code === 1) {
      return res.data
    }
    if (res.code === 401) {
      // silent401：登录态探测专用，不跳转、不提示（见 stores/user.fetchInfo）
      if (!response.config.silent401) {
        // 动态 import 避免 router ↔ api 循环依赖
        const { default: router } = await import('../router')
        const current = router.currentRoute.value
        if (current.path !== '/login') {
          router.push({ path: '/login', query: { redirect: current.fullPath } })
        }
      }
      const err = new Error(res.msg || '未登录')
      err.code = 401
      return Promise.reject(err)
    }
    // code === 0 业务失败
    ElMessage.error(res.msg || '操作失败')
    const err = new Error(res.msg || '操作失败')
    err.code = 0
    return Promise.reject(err)
  },
  (error) => {
    ElMessage.error('网络异常')
    return Promise.reject(error)
  }
)

export default request
