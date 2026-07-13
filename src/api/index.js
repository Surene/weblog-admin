import axios from 'axios'

const api = axios.create({
  baseURL: '/api/admin',
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response && err.response.status === 401 || err.response && err.response.status === 403) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    const msg = err.response?.data?.message || err.message || 'request failed'
    console.error('[API]', msg)
    return Promise.reject(new Error(msg))
  }
)

export default api
