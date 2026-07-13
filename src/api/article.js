import api from './index.js'

export const articleApi = {
  createDraft(title) {
    return api.post('/articles/draft', { title })
  },
  update(id, data) {
    return api.put(`/articles/${id}`, data)
  },
  getById(id) {
    return api.get(`/articles/${id}`)
  },
  getList(params) {
    return api.get('/articles', { params })
  },
  delete(id) {
    return api.delete(`/articles/${id}`)
  },
  restore(id) {
    return api.put(`/articles/${id}/restore`)
  },
}
