import api from './index.js'

export const draftHistoryApi = {
  getByArticle(articleId) {
    return api.get(`/draft-history/article/${articleId}`)
  },
  getById(historyId) {
    return api.get(`/draft-history/${historyId}`)
  },
}
