<template>
  <div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <el-button @click="$router.back()">返回</el-button>
      <h2 style="margin:0;font-size:22px">文章历史</h2>
      <span style="color:#909399">文章 #{{ articleId }}</span>
    </div>

    <div v-if="histories.length===0 && !loading" style="text-align:center;padding:60px">
      <el-empty description="暂无历史记录" />
    </div>

    <el-timeline v-else>
      <el-timeline-item
        v-for="h in histories" :key="h.id"
        :timestamp="formatDate(h.createdAt)"
        placement="top"
        :type="h.status === 'published' ? 'success' : 'info'"
      >
        <el-card shadow="hover" style="cursor:pointer" @click="selectedId = selectedId===h.id ? null : h.id">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-weight:600">{{ h.title || 'untitled' }}</span>
            <el-tag :type="h.status === 'published' ? 'success' : 'info'" size="small">
              {{ h.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </div>
          <div v-if="selectedId===h.id" style="margin-top:12px">
            <pre style="background:#f5f7fa;padding:12px;border-radius:6px;font-size:13px;white-space:pre-wrap;max-height:300px;overflow-y:auto">{{ h.contentMd || '(empty)' }}</pre>
          </div>
          <div v-else style="font-size:12px;color:#909399;margin-top:4px">点击展开</div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { articleHistoryApi } from '../api/articleHistory.js'

const route = useRoute()
const articleId = ref(Number(route.params.articleId))
const histories = ref([])
const loading = ref(false)
const selectedId = ref(null)

onMounted(async () => {
  loading.value = true
  try { const r = await articleHistoryApi.getByArticle(articleId.value); histories.value = r.data || [] } catch(e){}
  finally { loading.value = false }
})

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>