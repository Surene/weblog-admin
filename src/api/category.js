import api from './index.js'

export const categoryApi = {
  create(data) {
    return api.post('/categories', data)
  },
  update(id, data) {
    return api.put(`/categories/${id}`, data)
  },
  getAll() {
    return api.get('/categories')
  },
  remove(id) {
    return api.delete(`/categories/${id}`)
  },
}
