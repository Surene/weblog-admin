import axios from 'axios'

const authClient = axios.create({
  baseURL: '/api/admin',
  timeout: 15000,
})

authClient.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || err.message || 'request failed'
    return Promise.reject(new Error(msg))
  }
)

export const authApi = {
  login(data) {
    return authClient.post('/auth/login', data)
  },
}