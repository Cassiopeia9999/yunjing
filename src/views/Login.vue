<template>
  <div class="login-container flex justify-center items-center min-h-screen bg-gray-100">
    <div class="login-form p-8 bg-white rounded-xl shadow-lg max-w-lg w-full">
      <!-- 登录二维码 -->
      <div class="flex justify-center mb-6">
        <img src="https://via.placeholder.com/150" alt="二维码" class="w-24 h-24" />
      </div>

      <!-- 登录表单 -->
      <h2 class="text-2xl font-bold text-center mb-4">登录</h2>
      <el-form :model="form" ref="formRef" label-width="100px">
        <!-- 用户名输入框 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button type="primary" class="w-full" @click="handleLogin">登录</el-button>
        </el-form-item>

        <!-- 记住我和忘记密码 -->
        <el-form-item>
          <div class="flex justify-between">
            <label class="text-sm">
              <input type="checkbox" class="mr-2" /> 记住我
            </label>
            <a href="#" class="text-sm text-blue-500">忘记密码?</a>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'

const form = ref({
  username: '',
  password: ''
})

const handleLogin = () => {
  if (!form.value.username || !form.value.password) {
    alert('请输入用户名和密码')
  } else {
    alert(`欢迎，${form.value.username}`)
    // 你可以在这里添加实际的登录逻辑，进行跳转等操作
  }
}
</script>

<style scoped>
.login-container {
  background-color: #f4f4f4;
}

.login-form {
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.el-form-item {
  margin-bottom: 20px;
}

.el-button {
  padding: 0.8em;
  font-size: 1.2em;
}

input[type="checkbox"] {
  margin-right: 8px;
}

/* 针对大屏幕（PC）调整样式 */
@media (min-width: 1024px) {
  .login-form {
    width: 40%;  /* 设置在PC端登录框的宽度 */
  }
}

/* 响应式设计：在手机端调整 */
@media (max-width: 1024px) {
  .login-form {
    width: 80%;  /* 在移动端调整为更宽的登录框 */
  }
}
</style>
