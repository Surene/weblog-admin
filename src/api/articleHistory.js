import api from './index.js'

export const articleHistoryApi = {
  getByArticle(articleId) {
    return api.get(`/article-history/article/${articleId}`)
  },
  getById(historyId) {
    return api.get(`/article-history/${historyId}`)
  },
}