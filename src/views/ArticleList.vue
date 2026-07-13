<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="margin:0;font-size:22px">Articles</h2>
      <el-button type="primary" @click="createDraft">
        <el-icon><Plus /></el-icon> New Draft
      </el-button>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px">
      <el-select v-model="filterCategory" placeholder="All Categories" clearable @change="page=1;loadArticles()" style="width:200px">
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-input v-model="filterKeyword" placeholder="Search articles..." clearable @keyup.enter="page=1;loadArticles()" style="width:280px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button @click="loadArticles">Search</el-button>
      <el-checkbox v-model="showDeleted" @change="page=1;loadArticles()" style="margin-left:8px">显示已隐藏</el-checkbox>
    </div>

    <el-table :data="articles" v-loading="loading" stripe style="width:100%">
      <el-table-column prop="title" label="标题" min-width="200">
        <template #default="{row}">
          <span :style="row.deleted === 1 ? 'text-decoration:line-through;color:#999' : ''">{{ row.title || 'untitled' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="置顶" width="80">
        <template #default="{row}">
          <el-tag v-if="String(row.id)===topArticleId" type="warning" size="small">置顶</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="140">
        <template #default="{row}">{{ getCategoryName(row.categoryId) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{row}">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="160">
        <template #default="{row}">{{ formatDate(row.publishedAt) }}</template>
      </el-table-column>
      <el-table-column label="最近更新" width="160">
        <template #default="{row}">{{ formatDate(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="Actions" width="220" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="$router.push('/editor/' + row.id)">Edit</el-button>
          <el-button size="small" @click="$router.push('/draft-history/' + row.id)">History</el-button>
          <template v-if="row.deleted === 1">
            <el-button size="small" type="success" @click="handleRestore(row)">Restore</el-button>
          </template>
          <template v-else>
            <el-button size="small" type="danger" @click="handleDelete(row)">Hide</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="articles.length===0 && !loading" style="text-align:center;padding:60px;color:#909399">
      <el-empty description="No articles yet" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { articleApi } from '../api/article.js'
import { configApi } from '../api/config.js'
import { categoryApi } from '../api/category.js'

const router = useRouter()
const articles = ref([])
const topArticleId = ref('')
const categories = ref([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const pageSize = 20
const filterCategory = ref('')
const filterKeyword = ref('')
const showDeleted = ref(false)

onMounted(() => { loadCategories(); loadArticles(); loadTopArticle() })

async function loadCategories() {
  try { const r = await categoryApi.getAll(); categories.value = r.data || [] } catch(e){}
}

async function loadTopArticle() {
  try { const r = await configApi.getAll(); topArticleId.value = r.data?.top_article_id || '' } catch(e){}
}

async function loadArticles() {
  loading.value = true
  try {
    const params = { page: page.value, size: pageSize, showDeleted: showDeleted.value }
    if (filterCategory.value) params.categoryId = filterCategory.value
    if (filterKeyword.value) params.keyword = filterKeyword.value
    const r = await articleApi.getList(params)
    if (r.data && r.data.list) {
      articles.value = r.data.list || []
      total.value = r.data.total || 0
    } else {
      articles.value = r.data || []
    }
  } catch(e) { articles.value = [] }
  finally { loading.value = false }
}

function handlePageChange(p) {
  page.value = p
  loadArticles()
}

async function handleRestore(row) {
  try {
    await articleApi.restore(row.id)
    ElMessage.success('已恢复')
    loadArticles()
  } catch(e) { ElMessage.error('操作失败') }
}

async function handleDelete(row) {
  ElMessageBox.confirm(
    '确定隐藏文章「' + (row.title || 'untitled') + '」？',
    '确认隐藏',
    { confirmButtonText: '隐藏', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await articleApi.delete(row.id)
      ElMessage.success('已隐藏')
      loadArticles()
    } catch(e) { ElMessage.error('操作失败') }
  }).catch(() => {})
}

function createDraft() {
  router.push('/editor')
}

function getCategoryName(id) {
  const c = categories.value.find(c => c.id === id)
  return c ? c.name : '-'
}

function statusType(s) {
  return s === 'published' ? 'success' : s === 'draft' ? 'warning' : 'info'
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}
</script>
