import request from './index'

export function create(data) {
  return request.post('/orders', data)
}

// {page, pageSize} → PageResult{total,page,pageSize,records}
export function list(params) {
  return request.get('/orders', { params })
}

export function detail(id) {
  return request.get(`/orders/${id}`)
}

export function pay(id) {
  return request.post(`/orders/${id}/pay`)
}

export function cancel(id) {
  return request.post(`/orders/${id}/cancel`)
}
