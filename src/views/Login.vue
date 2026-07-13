<template>
  <div class="login-wrap">
    <div class="login-card">
      <h2>Blog Admin</h2>
      <p class="subtitle">请登录以继续</p>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <input v-model="form.username" placeholder="用户名" class="login-input" autofocus />
        </div>
        <div class="form-group">
          <input v-model="form.password" type="password" placeholder="密码" class="login-input" />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/auth.js'

const router = useRouter()
const form = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const r = await authApi.login(form.value)
    if (r.code === 200 && r.data) {
      localStorage.setItem('admin_token', r.data.token)
      localStorage.setItem('admin_nickname', r.data.nickname || '')
      router.push('/')
    } else {
      error.value = r.message || '登录失败'
    }
  } catch (e) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f5f5;
}
.login-card {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  width: 360px;
}
.login-card h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #303133;
}
.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0 0 24px;
}
.form-group {
  margin-bottom: 16px;
}
.login-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.login-input:focus {
  border-color: #409eff;
}
.error-msg {
  color: #f56c6c;
  font-size: 13px;
  margin-bottom: 12px;
}
.login-btn {
  width: 100%;
  padding: 10px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
.login-btn:hover { background: #337ecc; }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>