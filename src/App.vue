<template>
  <el-container style="height:100vh">
    <el-aside width="220px" style="background:#1a1a2e;display:flex;flex-direction:column">
      <div style="padding:20px;color:#fff;font-size:18px;font-weight:700;cursor:pointer" @click="$router.push('/')">
        Blog Admin
      </div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#1a1a2e"
        text-color="#9ca3af"
        active-text-color="#fff"
        style="border-right:none"
      >
        <el-menu-item index="/">
          <el-icon><Document /></el-icon>
          <span>Articles</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Collection /></el-icon>
          <span>Categories</span>
        </el-menu-item>
        <el-menu-item index="/comments">
          <el-icon><ChatDotRound /></el-icon>
          <span>Comments</span>
        </el-menu-item>
<el-menu-item index="/config">
          <el-icon><Setting /></el-icon>
          <span>Settings</span>
        </el-menu-item>
        <div style="flex:1"></div>
        <el-menu-item index="/login" @click="handleLogout" style="margin-top:auto;border-top:1px solid rgba(255,255,255,0.1)">
          <el-icon><SwitchButton /></el-icon>
          <span>Logout</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-main style="background:#f8f7f4;padding:24px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Document, Collection, Setting, ChatDotRound } from '@element-plus/icons-vue'
import { SwitchButton } from '@element-plus/icons-vue'
const route = useRoute()

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_nickname')
    window.location.href = '/login'
  }).catch(() => {})
}
</script>
