import api from './index.js'

export const dashboardApi = {
  getStats() {
    return api.get('/dashboard/stats')
  },
}
