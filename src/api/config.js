import api from './index.js'

export const configApi = {
  getAll() {
    return api.get('/config')
  },
  update(configKey, configValue) {
    return api.put('/config', { configKey, configValue })
  },
}
