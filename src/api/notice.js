import request from './index'

export function list() {
  return request.get('/notices')
}
