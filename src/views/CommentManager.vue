<template>
  <div class="comment-manager">
    <h2 style="font-size:20px;margin-bottom:24px">评论管理</h2>

    <el-radio-group v-model="currentStatus" @change="loadComments" style="margin-bottom:20px">
      <el-radio-button value="approved">已通过</el-radio-button>
      <el-radio-button value="rejected">已拒绝</el-radio-button>
      <el-radio-button value="">全部</el-radio-button>
    </el-radio-group>

    <el-table :data="comments" style="width:100%" v-loading="loading">
      <el-table-column label="评论者" width="150">
        <template #default="{ row }">
          <div>
            <strong>{{ row.authorName }}</strong>
            <div v-if="row.authorUrl" style="font-size:12px;color:#909399">{{ row.authorUrl }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="内容" min-width="300">
        <template #default="{ row }">
          <div style="font-size:13px;line-height:1.6;white-space:pre-wrap">{{ row.content }}</div>
          <div v-if="row.parentId" style="font-size:12px;color:#909399;margin-top:4px">回复评论 #{{ row.parentId }}</div>
        </template>
      </el-table-column>
      <el-table-column label="文章" width="200">
        <template #default="{ row }">
          <span style="font-size:13px">{{ row.articleTitle || '文章 #' + row.articleId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'" size="small">
            {{ row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已拒绝' : '待审' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status !== 'approved'" size="small" type="success" @click="handleApprove(row.id)">通过</el-button>
          <el-button v-if="row.status !== 'rejected'" size="small" type="warning" @click="handleReject(row.id)">拒绝</el-button>
          <el-button size="small" @click="openReply(row)">回复</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="total > 20" style="margin-top:20px;text-align:center">
      <el-pagination
        :current-page="page"
        :page-size="20"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Reply Dialog -->
    <el-dialog v-model="replyVisible" title="回复评论" width="500px">
      <div style="margin-bottom:12px;padding:12px;background:#f5f5f5;border-radius:4px;font-size:13px;color:#666">
        <strong>{{ replyTarget.authorName }}</strong>：{{ replyTarget.content }}
      </div>
      <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="输入回复内容..." />
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { commentApi } from '../api/comment.js'

const comments = ref([])
const loading = ref(false)
const currentStatus = ref('approved')
const page = ref(1)
const total = ref(0)
const bloggerName = ref('博主')

const replyVisible = ref(false)
const replyTarget = ref({})
const replyContent = ref('')

async function loadBloggerName() {
  try {
    const r = await axios.get('/api/admin/config')
    if (r.data?.data?.blogger_name) bloggerName.value = r.data.data.blogger_name
  } catch (e) {}
}

onMounted(async () => {
  await loadBloggerName()
  loadComments()
})

async function loadComments() {
  loading.value = true
  try {
    const r = await commentApi.getAll({ status: currentStatus.value || undefined, page: page.value, size: 20 })
    comments.value = r.data.list || []
    total.value = r.data.total || 0
  } catch (e) {
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

async function handleApprove(id) {
  try {
    await commentApi.approve(id)
    ElMessage.success('已通过')
    loadComments()
  } catch (e) { ElMessage.error('操作失败') }
}

async function handleReject(id) {
  try {
    await commentApi.reject(id)
    ElMessage.success('已拒绝')
    loadComments()
  } catch (e) { ElMessage.error('操作失败') }
}

async function handleDelete(id) {
  ElMessageBox.confirm('确定删除该评论？此操作不可撤销。', '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await commentApi.delete(id)
      ElMessage.success('已删除')
      loadComments()
    } catch (e) { ElMessage.error('删除失败') }
  }).catch(() => {})
}

function openReply(comment) {
  replyTarget.value = comment
  replyContent.value = ''
  replyVisible.value = true
}

async function submitReply() {
  if (!replyContent.value.trim()) {
    return ElMessage.warning('请输入回复内容')
  }
  try {
    await commentApi.reply({
      articleId: replyTarget.value.articleId,
      parentId: replyTarget.value.id,
      authorName: bloggerName.value,
      content: replyContent.value.trim(),
    })
    ElMessage.success('回复已发送')
    replyVisible.value = false
    replyContent.value = ''
    loadComments()
  } catch (e) {
    ElMessage.error('回复失败')
  }
}

function handlePageChange(p) {
  page.value = p
  loadComments()
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0') + ' ' +
    String(d.getHours()).padStart(2,'0') + ':' +
    String(d.getMinutes()).padStart(2,'0')
}
</script>

<style scoped>
.comment-manager {
  max-width: 1200px;
}
</style>