import request from './index'

// 分页列表：{categoryId, keyword, page, pageSize} → PageResult{total,page,pageSize,records}
export function list(params) {
  return request.get('/dishes', { params })
}

export function hot() {
  return request.get('/dishes/hot')
}

export function detail(id) {
  return request.get(`/dishes/${id}`)
}
