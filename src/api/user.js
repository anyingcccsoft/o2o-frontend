import request from './index'

export function register(data) {
  return request.post('/user/register', data)
}

export function login(data) {
  return request.post('/user/login', data)
}

export function logout() {
  return request.post('/user/logout')
}

// config 可传 { silent401: true } 用于登录态静默探测
export function getInfo(config = {}) {
  return request.get('/user/info', config)
}

export function updateInfo(data) {
  return request.put('/user/info', data)
}

export function changePassword(data) {
  return request.post('/user/password', data)
}
