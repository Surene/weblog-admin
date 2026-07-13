import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/', name: 'articles', component: () => import('../views/ArticleList.vue') },
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/editor/:id?', name: 'editor', component: () => import('../views/ArticleEditor.vue') },
  { path: '/categories', name: 'categories', component: () => import('../views/CategoryManager.vue') },
  { path: '/draft-history/:articleId', name: 'draftHistory', component: () => import('../views/DraftHistory.vue') },
  { path: '/config', name: 'config', component: () => import('../views/SystemConfig.vue') },
  { path: '/comments', name: 'comments', component: () => import('../views/CommentManager.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.name !== 'login' && !token) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
