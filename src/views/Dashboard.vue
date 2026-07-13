<template>
  <div>
    <h2 style="font-size:22px;margin:0 0 24px">Dashboard</h2>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <div style="font-size:14px;color:#888">总文章数</div>
          <div style="font-size:32px;font-weight:700;margin-top:8px">{{ stats.articleCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div style="font-size:14px;color:#888">总评论数</div>
          <div style="font-size:32px;font-weight:700;margin-top:8px">{{ stats.commentCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div style="font-size:14px;color:#888">总阅读量</div>
          <div style="font-size:32px;font-weight:700;margin-top:8px">{{ stats.viewCount }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { dashboardApi } from '../api/dashboard.js'

const stats = ref({ articleCount: 0, commentCount: 0, viewCount: 0 })

onMounted(async () => {
  try {
    const r = await dashboardApi.getStats()
    stats.value = r.data || {}
  } catch (e) {
    ElMessage.error('加载统计数据失败')
  }
})
</script>
