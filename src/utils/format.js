/**
 * 通用格式化工具与业务字典
 */

const PLACEHOLDER_IMG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">' +
      '<rect width="100%" height="100%" fill="#f0f0f0"/>' +
      '<text x="50%" y="50%" fill="#bbb" font-size="16" text-anchor="middle" dominant-baseline="middle">暂无图片</text>' +
      '</svg>'
  )

export function formatMoney(v) {
  const num = Number(v)
  return '¥' + (Number.isFinite(num) ? num : 0).toFixed(2)
}

// LocalDateTime 字符串（如 2026-07-31T12:30:00）→ yyyy-MM-dd HH:mm
export function formatTime(str) {
  if (!str) return ''
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return str
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function imgUrl(url) {
  if (!url) return PLACEHOLDER_IMG
  if (url.startsWith('http')) return url
  return import.meta.env.VITE_API_BASE + url
}

export const ORDER_STATUS_TEXT = {
  0: '待接单',
  1: '制作中',
  2: '配送中',
  3: '已完成',
  4: '已取消',
}

// el-tag type 映射
export const ORDER_STATUS_TYPE = {
  0: 'warning',
  1: 'primary',
  2: 'info',
  3: 'success',
  4: 'danger',
}

export const PAY_STATUS_TEXT = {
  0: '待支付',
  1: '已支付',
}

export const PAY_METHOD_TEXT = {
  1: '微信支付',
  2: '支付宝',
  3: '货到付款',
}
