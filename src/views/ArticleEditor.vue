<template>
  <div class="editor-page">
    <div class="editor-topbar">
      <el-button @click="$router.push('/')" :icon="ArrowLeft">Back</el-button>
      <div class="topbar-center">
        <input
          v-model="title"
          placeholder="Article title..."
          class="title-input"
        />
        <el-select v-model="categoryId" placeholder="No Category" clearable size="small">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </div>
      <div class="topbar-actions">
        <span v-if="saving" class="save-hint">保存中...</span>
        <span v-else-if="lastSaved" class="save-hint">已保存 {{ lastSaved }}</span>
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handlePublish">发布</el-button>
      </div>
    </div>

    <div class="editor-body">
      <md-editor
        v-model="contentMd"
        language="zh-CN"
        :toolbars="toolbars"
        :footers="['markdownTotal']"
        style="height:100%"
        @on-change="onContentChange"
        @on-save="handleSaveDraft"
        @onUploadImg="onUploadImg"
      />
    </div>

    <!-- Publish confirm dialog -->
    <el-dialog v-model="confirmVisible" title="确认发布" width="480px">
      <el-form label-width="80px" size="default">
        <el-form-item label="标题">
          <el-input v-model="title" placeholder="文章标题" />
        </el-form-item>
        <el-form-item label="Slug">
          <el-input v-model="slugInput" placeholder="URL标识（留空自动生成）" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="summaryInput" type="textarea" :rows="2" placeholder="文章摘要，用于列表展示" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="categoryId" placeholder="无分类" clearable style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <span>已发布</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="doPublish">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { articleApi } from '../api/article.js'
import { uploadApi } from '../api/upload.js'
import { categoryApi } from '../api/category.js'

const route = useRoute()
const router = useRouter()

// Use flat refs + editorKey to force re-mount when loading
const articleId = ref(null)
const title = ref('')
const contentMd = ref('')
const categoryId = ref(null)
const articleStatus = ref('draft')
const categories = ref([])
const saving = ref(false)
const lastSaved = ref('')
const confirmVisible = ref(false)
const slugInput = ref('')
const summaryInput = ref('')

const slugPreview = computed(() => {
  if (!title.value) return ''
  // Convert Chinese to pinyin-like (simple approach: use timestamp + random)
  const hasChinese = /[\u4e00-\u9fff]/.test(title.value)
  if (hasChinese) {
    const clean = title.value.replace(/[^\u4e00-\u9fffa-zA-Z0-9\s-]/g, '').trim().substring(0,20)
    const ts = Date.now().toString(36).slice(-4)
    return clean + '-' + ts
  }
  return title.value.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').substring(0,80)
})
const categoryName = computed(() => {
  const cat = categories.value.find(c => c.id === categoryId.value)
  return cat ? cat.name : '(none)'
})

const toolbars = [
  'bold', 'italic', 'strikethrough', 'title', '-',
  'orderedList', 'unorderedList', 'task', '-',
  'code', 'codeRow', 'quote', 'link', 'image', 'table', '-',
  'preview', 'fullscreen',
]

let autoSaveTimer = null
let lastContent = ''
let isSaving = false

function isDirty() {
  return contentMd.value !== lastContent
}

onBeforeRouteLeave((to, from, next) => {
  if (isDirty() && !isSaving) {
    ElMessageBox.confirm(
      '当前有未保存的修改，是否保存草稿？',
      '提示',
      {
        confirmButtonText: '保存并离开',
        cancelButtonText: '直接离开',
        distinguishCancelAndClose: true,
        type: 'warning',
      }
    ).then(async () => {
      await handleSaveDraft()
      next()
    }).catch((action) => {
      if (action === 'cancel') {
        next()
      } else {
        next(false)
      }
    })
  } else {
    next()
  }
})

// ====== LOAD ======
onMounted(async () => {
  try { const r = await categoryApi.getAll(); categories.value = r.data || [] } catch (e) {}

  const id = route.params.id
  if (id) {
    articleId.value = Number(id)
    try {
      const r = await articleApi.getById(id)
      const a = r.data
      title.value = a.title || ''
      slugInput.value = a.slug || ''
      summaryInput.value = a.summary || ''
      categoryId.value = a.categoryId || null
      articleStatus.value = a.status || 'draft'
      // Wait for md-editor to fully mount, then inject content
      const savedContent = a.contentMd || ''
      setTimeout(() => {
        contentMd.value = savedContent
        lastContent = savedContent
      }, 150)
    } catch (e) {
      ElNotification({ title: '错误', message: '文章未找到', type: 'error', position: 'top-right', duration: 3000 })
      router.push('/')
    }
  }

  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  document.removeEventListener('keydown', handleKeydown)
})

async function onUploadImg(files, callback) {
  const res = []
  for (const file of files) {
    try {
      const r = await uploadApi.uploadImage(file)
      res.push({ url: r.data.url, alt: r.data.alt || file.name })
    } catch (e) {
      console.error('Upload failed:', e)
    }
  }
  callback(res)
}

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSaveDraft()
  }
}

// ====== AUTO SAVE ======
function onContentChange() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(autoSave, 3000)
}

async function autoSave() {
  if (!articleId.value) return
  if (contentMd.value === lastContent) return
  const status = articleStatus.value === 'published' ? 'published' : 'draft'
  await doSave(status, true)
}

// ====== SAVE DRAFT ======
async function handleSaveDraft() {
  await ensureCreated()
  if (articleStatus.value === 'published') {
    ElMessageBox.confirm(
      '当前文章已发布，保存草稿将撤回发布状态，是否继续？',
      '确认操作',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    ).then(async () => {
      await doSave('draft', false)
      articleStatus.value = 'draft'
      ElNotification({ title: '保存成功', message: '文章已撤回为草稿', type: 'success', position: 'top-right', duration: 3000 })
    }).catch(() => {})
    return
  }
  await doSave('draft', false)
  ElNotification({
    title: '保存成功',
    message: '文章草稿已保存',
    type: 'success',
    position: 'top-right',
    duration: 3000,
    offset: 60
  })
}

// ====== PUBLISH ======
async function handlePublish() {
  if (!title.value || title.value === 'untitled') {
    return ElNotification({
    title: '提示',
    message: '请先设置标题',
    type: 'warning',
    position: 'top-right',
    duration: 3000
  })
  }
  // Only set slug preview if user hasn't manually entered one
  if (!slugInput.value) {
    slugInput.value = slugPreview.value
  }
  confirmVisible.value = true
}

async function doPublish() {
  confirmVisible.value = false
  await ensureCreated()
  await doSave('published', false)
  articleStatus.value = 'published'
  ElNotification({
    title: '发布成功',
    message: '文章已发布',
    type: 'success',
    position: 'top-right',
    duration: 3000,
    offset: 60
  })
  router.push('/')
}

// ====== CORE ======
async function ensureCreated() {
  if (articleId.value) return
  try {
    const r = await articleApi.createDraft(title.value || 'untitled')
    articleId.value = r.data
    router.replace('/editor/' + articleId.value)
  } catch (e) {
    ElNotification({ title: '错误', message: '创建草稿失败: ' + e.message, type: 'error', position: 'top-right', duration: 3000 })
    throw e
  }
}

async function doSave(status, silent) {
  if (!articleId.value) {
    if (!silent) ElNotification({ title: '错误', message: '文章ID不存在', type: 'error', position: 'top-right', duration: 3000 })
    return
  }
  saving.value = true
    isSaving = true
  try {
    const finalSlug = slugInput.value || slugPreview.value || ('article-' + Date.now())
    const payload = {
      title: title.value,
      slug: finalSlug,
      summary: summaryInput.value || '',
      contentMd: contentMd.value,
      categoryId: categoryId.value,
      status: status,
    }
    console.log('[doSave]', articleId.value, payload)
    await articleApi.update(articleId.value, payload)
    lastContent = contentMd.value
    articleStatus.value = status
    lastSaved.value = new Date().toLocaleTimeString('zh-CN')
    console.log('[doSave] success')
  } catch (e) {
    console.error('[doSave] failed:', e)
    if (!silent) ElNotification({ title: '保存失败', message: e.message, type: 'error', position: 'top-right', duration: 3000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  margin: -24px;
  background: #fff;
}
.editor-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}
.topbar-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}
.title-input {
  width: 400px;
  border: none;
  font-size: 18px;
  font-weight: 600;
  padding: 6px 10px;
  outline: none;
  background: transparent;
  text-align: center;
  color: #303133;
}
.title-input::placeholder { color: #c0c4cc; font-weight: 400; }
.title-input:focus { background: #f5f7fa; border-radius: 6px; }
.topbar-actions { display: flex; align-items: center; gap: 8px; }
.save-hint { font-size: 12px; color: #909399; margin-right: 4px; }
.editor-body { flex: 1; overflow: hidden; }
:deep(.md-editor) { border: none !important; border-radius: 0 !important; }
:deep(.md-editor-toolbar) { border-radius: 0 !important; }

:deep(.md-editor-preview img),
:deep(.md-editor-catalog) img {
  max-width: 60% !important;
  display: block !important;
  margin: 16px auto !important;
  border-radius: 4px;
}
:deep(.md-editor-wrapper img) {
  max-width: 60% !important;
  height: auto !important;
  display: block !important;
  margin: 16px auto !important;
}
</style>
