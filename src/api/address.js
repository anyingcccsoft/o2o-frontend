import request from './index'

export function list() {
  return request.get('/addresses')
}

export function add(data) {
  return request.post('/addresses', data)
}

export function update(id, data) {
  return request.put(`/addresses/${id}`, data)
}

export function remove(id) {
  return request.delete(`/addresses/${id}`)
}

export function setDefault(id) {
  return request.put(`/addresses/${id}/default`)
}
