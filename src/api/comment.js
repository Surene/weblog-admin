import api from './index.js'

export const commentApi = {
  getAll(params) {
    return api.get('/comments', { params })
  },
  approve(id) {
    return api.put(`/comments/${id}/status?status=approved`)
  },
  reject(id) {
    return api.put(`/comments/${id}/status?status=rejected`)
  },
  reply(data) {
    return api.post('/comments/reply', data)
  },
  delete(id) {
    return api.delete(`/comments/${id}`)
  },
}