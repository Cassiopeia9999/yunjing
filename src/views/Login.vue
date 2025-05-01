<template>
  <div class="flex justify-center items-center min-h-screen m-0 p-0 bg-gray-200">
    <div class="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full absolute top-60 right-60 transform translate-x-10 translate-y-10">
      <!-- Login Form -->
      <h2 class="text-2xl font-bold text-center mb-6">Login</h2>
      <el-form :model="form" ref="formRef" label-width="80px" class="space-y-4">
        <!-- Username input -->
        <el-form-item label="用户名" prop="username" class="flex items-center">
          <el-input
              v-model="form.username"
              placeholder="请输入用户名"
           />
        </el-form-item>

        <!-- Password input -->
        <el-form-item label="密码" prop="password" class="flex items-center">
          <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
           />
        </el-form-item>

        <!-- Login button -->
        <el-form-item>
          <el-button
              type="primary"
              class="w-full py-3 font-medium text-white bg-blue-500 hover:bg-blue-600 rounded"
              @click="handleLogin"
          >Login</el-button>
        </el-form-item>

        <!-- Remember me and forgot password links -->
        <el-form-item>
          <div class="flex justify-between text-sm text-gray-700 w-full">
            <label class="flex items-center">
              <input type="checkbox" class="mr-2" /> Remember me
            </label>
            <a href="#" class="text-blue-500 hover:underline">Forgot password?</a>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import { useStore } from 'vuex' // 引入 Vuex store
import { useRouter } from 'vue-router' // 引入 Vue Router

// 表单模型
const form = ref({
  username: '',
  password: ''
})

// 获取 Vuex store 和 Vue Router 实例
const store = useStore()
const router = useRouter()

// 登录处理方法
const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    alert('Please enter username and password')
    return
  }

  const userInfo = {
    username: form.value.username,
    password: form.value.password,
    type: 'username'  // 可以根据需要添加其他类型标识
  }

  try {
    // 调用 Vuex 的 Login action
    await store.dispatch('Login', userInfo)

    router.push('/inner/dashboard')  // 登录成功后跳转到首页
  } catch (error) {
    alert('Login failed, please check your username and password')
    console.error('Login error:', error)
  }
}
</script>

<style scoped>

</style>