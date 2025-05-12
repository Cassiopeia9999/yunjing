<template>
  <div class="min-h-screen bg-cover bg-center flex items-center justify-center" style="background-image: url('/images/login-bg.png')">
    <div
        class="absolute bg-white rounded-lg shadow-lg px-10 py-8 max-w-md w-full transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
        style="top: 30%; right: 10%;"
    >
      <h2 class="text-2xl font-bold text-center mb-6">欢迎登录</h2>
      <el-form :model="form" ref="formRef" label-width="80px" class="space-y-4">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              class="w-full py-3 font-medium rounded-md"
              @click="handleLogin"
          >登 录</el-button>
        </el-form-item>

        <el-form-item>
          <div class="flex justify-between text-sm text-gray-600 w-full px-1">
            <label class="flex items-center">
              <el-checkbox v-model="rememberMe" class="mr-2" /> 记住我
            </label>
            <a href="#" class="text-blue-500 hover:underline">忘记密码？</a>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import Cookies from 'js-cookie'
import { getToken } from '@/utils/auth'

const form = ref({
  username: '',
  password: ''
})
const rememberMe = ref(false)
const router = useRouter()
const store = useStore()

const handleLogin = async () => {
  const token = getToken()
  if (token) {
    ElMessage.success('您已登录，正在跳转首页...')
    router.push('/inner/dashboard')
    return
  }

  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  const userInfo = {
    username: form.value.username,
    password: form.value.password,
    tenantId: 180,
    type: 'username'
  }

  try {
    await store.dispatch('Login', userInfo)
    ElMessage.success('登录成功，欢迎回来！')
    if (rememberMe.value) {
      Cookies.set('remember_username', form.value.username, { expires: 7 })
      Cookies.set('remember_password', form.value.password, { expires: 7 })
    } else {
      Cookies.remove('remember_username')
      Cookies.remove('remember_password')
    }
    router.push('/inner/dashboard')
  } catch (error) {
    ElMessage.error('登录失败，请检查用户名和密码')
    console.error('登录错误:', error)
  }
}

onMounted(() => {
  const savedUsername = Cookies.get('remember_username')
  const savedPassword = Cookies.get('remember_password')
  if (savedUsername && savedPassword) {
    form.value.username = savedUsername
    form.value.password = savedPassword
    rememberMe.value = true
  }
})
</script>

<style scoped>
/* 无需样式块，全部由 Tailwind 控制 */
</style>
