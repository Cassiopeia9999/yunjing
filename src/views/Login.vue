<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
      <!-- Login Form -->
      <h2 class="text-2xl font-bold text-center mb-4">Login</h2>
      <el-form :model="form" ref="formRef" label-width="100px">
        <!-- Username input -->
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" placeholder="Enter your username" class="w-full p-2 border rounded-md" />
        </el-form-item>

        <!-- Password input -->
        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" placeholder="Enter your password" class="w-full p-2 border rounded-md" />
        </el-form-item>

        <!-- Login button -->
        <el-form-item>
          <el-button type="primary" class="w-full py-3 font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md" @click="handleLogin">Login</el-button>
        </el-form-item>

        <!-- Remember me and forgot password links -->
        <el-form-item>
          <div class="flex justify-between text-sm text-gray-700">
            <label>
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
    await store.dispatch('user/Login', userInfo)

    // 登录成功后，可以进行跳转
    alert(`Welcome, ${form.value.username}`)
    router.push('/home')  // 登录成功后跳转到首页
  } catch (error) {
    alert('Login failed, please check your username and password')
    console.error('Login error:', error)
  }
}
</script>

<style scoped>
/* 使用 TailwindCSS 进行样式设置 */
</style>
