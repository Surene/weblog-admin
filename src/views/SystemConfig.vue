<template>
  <div>
    <h2 style="font-size:22px;margin:0 0 20px">站点设置</h2>

    <el-card shadow="never" style="max-width:640px" v-loading="loading">
      <el-form label-width="140px" label-position="left">
        <el-form-item label="站点名称">
          <el-input v-model="configs.site_name" />
        </el-form-item>
        <el-form-item label="站点描述">
          <el-input v-model="configs.site_description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="顶部告示栏">
          <el-input v-model="configs.notice_bar" type="textarea" :rows="2" placeholder="填写后将在博客顶部显示告示栏，留空则不显示" />
        </el-form-item>
        <el-form-item label="置顶文章">
          <el-select v-model="configs.top_article_id" placeholder="选择置顶文章（留空则不置顶）" clearable filterable style="width:100%">
            <el-option v-for="a in allArticles" :key="a.id" :label="a.title" :value="String(a.id)" />
          </el-select>
        </el-form-item>
        <el-form-item label="博主名字">
          <el-input v-model="configs.blogger_name" placeholder="用于评论回复署名" />
        </el-form-item>
        <el-form-item label="GitHub URL">
          <el-input v-model="configs.github_url" placeholder="https://github.com/..." />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="configs.email" placeholder="your@email.com" />
        </el-form-item>
        <el-form-item label="站点URL">
          <el-input v-model="configs.site_url" placeholder="https://yourblog.com" />
        </el-form-item>
        <el-form-item label="ICP备案号">
          <el-input v-model="configs.icp_number" placeholder="京ICP备xxxxxxxx号" />
        </el-form-item>

        <el-divider content-position="left">SEO</el-divider>
        <el-form-item label="SEO描述">
          <el-input v-model="configs.seo_description" type="textarea" :rows="2" placeholder="用于搜索引擎摘要展示" />
        </el-form-item>
        <el-form-item label="SEO关键词">
          <el-input v-model="configs.seo_keywords" placeholder="博客,技术,生活 逗号分隔" />
        </el-form-item>

        <el-form-item label="显示阅读量">
          <el-switch v-model="configs.show_view_count" active-value="true" inactive-value="false" />
        </el-form-item>
        <el-form-item label="页脚文字">
          <el-input v-model="configs.footer_text" placeholder="自定义页脚补充说明" />
        </el-form-item>

        <el-divider content-position="left">评论设置</el-divider>
        <el-form-item label="开启评论">
          <el-switch v-model="configs.comment_enabled" active-value="true" inactive-value="false" />
        </el-form-item>
        <el-form-item label="回复邮件通知">
          <el-switch v-model="configs.email_notify_enabled" active-value="true" inactive-value="false" />
        </el-form-item>

        <el-divider content-position="left">社交链接</el-divider>
        <el-form-item label="GitHub">
          <el-input v-model="configs.social_github" placeholder="https://github.com/..." />
        </el-form-item>
        <el-form-item label="Twitter / X">
          <el-input v-model="configs.social_twitter" placeholder="https://x.com/..." />
        </el-form-item>
        <el-form-item label="抖音">
          <el-input v-model="configs.social_douyin" placeholder="https://douyin.com/..." />
        </el-form-item>
        <el-form-item label="B站">
          <el-input v-model="configs.social_bilibili" placeholder="https://bilibili.com/..." />
        </el-form-item>

        <el-form-item label="关于页面内容">
          <el-input v-model="configs.about_content" type="textarea" :rows="6" placeholder="支持 Markdown 格式" />
        </el-form-item>

        <el-divider content-position="left">显示Logo & Favicon</el-divider>
        <el-form-item label="网站Logo">
          <div style="display:flex;align-items:center;gap:12px">
            <el-image
              v-if="configs.site_logo"
              :src="configs.site_logo"
              style="width:48px;height:48px;border-radius:4px;border:1px solid #ddd"
              fit="contain"
            />
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleLogoSuccess"
              :before-upload="beforeUpload"
              accept="image/*"
            >
              <el-button size="small" type="primary">上传Logo</el-button>
            </el-upload>
            <el-button v-if="configs.site_logo" size="small" type="danger" text @click="configs.site_logo = ''">删除</el-button>
          </div>
        </el-form-item>
        <el-form-item label="网页图标Favicon">
          <div style="display:flex;align-items:center;gap:12px">
            <el-image
              v-if="configs.site_favicon"
              :src="configs.site_favicon"
              style="width:32px;height:32px;border-radius:4px;border:1px solid #ddd"
              fit="contain"
            />
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleFaviconSuccess"
              :before-upload="beforeUploadIcon"
              accept="image/*"
            >
              <el-button size="small" type="primary">上传Favicon</el-button>
            </el-upload>
            <el-button v-if="configs.site_favicon" size="small" type="danger" text @click="configs.site_favicon = ''">删除</el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveAll">保存全部</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { configApi } from '../api/config.js'
import { articleApi } from '../api/article.js'

const configs = ref({})
const loading = ref(false)
const allArticles = ref([])
const uploadUrl = '/api/admin/upload/image'

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: 'Bearer ' + token } : {}
})

onMounted(async () => {
  loading.value = true
  try { const r = await configApi.getAll(); configs.value = r.data || {} } catch(e){}
  try { const r = await articleApi.getList({page:1,size:200}); allArticles.value = r.data?.list || [] } catch(e){}
  finally { loading.value = false }
})

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) { ElMessage.error('只能上传图片文件'); return false }
  if (!isLt2M) { ElMessage.error('图片大小不能超过 2MB'); return false }
  return true
}

function beforeUploadIcon(file) {
  const isLt1M = file.size / 1024 / 1024 < 1
  if (!isLt1M) { ElMessage.error('图标大小不能超过 1MB'); return false }
  return beforeUpload(file)
}

function handleLogoSuccess(res) {
  if (res.code === 200 && res.data) {
    configs.value.site_logo = res.data.url
    ElMessage.success('Logo 上传成功')
  } else {
    ElMessage.error('上传失败')
  }
}

function handleFaviconSuccess(res) {
  if (res.code === 200 && res.data) {
    configs.value.site_favicon = res.data.url
    ElMessage.success('Favicon 上传成功')
  } else {
    ElMessage.error('上传失败')
  }
}

async function saveAll() {
  try {
    for(const [k,v] of Object.entries(configs.value)) {
      await configApi.update(k, v)
    }
    ElMessage.success('保存成功')
  } catch(e) { ElMessage.error('保存失败: ' + e.message) }
}
</script>