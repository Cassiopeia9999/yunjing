<template>
  <div class="home-container" style="background-image: url('/images/earthnight.jpg')">
    <div class="welcome-message">
      <h1 class="text-4xl font-bold text-center mb-4">欢迎来到首页</h1>
      <p class="text-center text-lg mb-6">这是一个简单的首页，点击按钮跳转到登录页面。</p>
      <el-button type="primary" @click="goToLogin" class="w-full">去登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  // 跳转到登录页
  router.push('/login')
}
</script>

<style scoped>
/* 默认 PC 端布局 */
.home-container {
  @apply flex justify-center items-center min-h-screen bg-gray-100;
  background-image: var(--home-background-image); /* 使用 CSS 变量 */
  background-size: cover; /* 覆盖整个容器 */
  background-position: center; /* 图片居中 */
  background-repeat: no-repeat; /* 防止图片重复 */
}

.welcome-message {
  @apply bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full;
}

/* 按钮与其他元素的间距 */
.el-button {
  @apply mt-4;
  /* margin-top 设置为 4 */
}

/* 针对小屏幕（手机）进行优化 */
@media (max-width: 1024px) {
  .home-container {
    padding: 1rem; /* 给容器添加额外的 padding，适应移动端 */
  }

  .welcome-message {
    @apply p-4;
    /* 增加内容区域的内边距，避免在小屏幕上过于紧凑 */
  }
}

/* 定义 CSS 变量 */
:root {
  --home-background-image: url('/images/earthnight.jpg'); /* 替换为你的图片路径 */
}
</style>
