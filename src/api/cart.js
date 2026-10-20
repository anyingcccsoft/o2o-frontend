import request from './index'

// config 可传 { silent401: true } 供购物车角标静默刷新
export function list(config = {}) {
  return request.get('/cart', config)
}

export function add(data) {
  return request.post('/cart', data)
}

export function update(id, data) {
  return request.put(`/cart/${id}`, data)
}

export function remove(id) {
  return request.delete(`/cart/${id}`)
}

export function clear() {
  return request.delete('/cart')
}
