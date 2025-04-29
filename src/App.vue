<template>
  <div id="app">
    <!-- 包裹 Navbar 的容器 -->
    <div class="navbar-container">
      <Navbar />  <!-- 导航栏组件 -->
    </div>
    <div class="content">
      <router-view />  <!-- 路由视图 -->
    </div>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
</script>

<style scoped>
/* 基本样式 */
#app {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;  /* 去除外部间距 */
  padding: 0; /* 去除内边距 */
}

/* 包裹 Navbar 的容器样式 */
.navbar-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #1a202c; /* 背景色 */
  z-index: 1000; /* 确保导航栏位于最上方 */
  padding: 10px 0 0 0; /* 设定导航栏高度 */
  display: flex;
  justify-content: center;  /* 居中导航栏内容 */
}

/* 内容区域的样式 */
.content {
  padding-top: 80px; /* 路由视图的上间距，避免被导航栏遮挡 */
  overflow-y: auto;  /* 启用垂直滚动条 */
  flex: 1; /* 使内容区域填满剩余的空间 */
  height: calc(100vh - 60px); /* 限制内容区域的高度，使其填充剩余的空间 */
  padding: 20px; /* 增加内边距 */
}

/* 设置最大宽度并居中对齐 */
@media (min-width: 1024px) {
  #app {
    max-width: 1800px;  /* 限制最大宽度 */
    margin: 0 auto;  /* 居中显示 */
    padding: 5px;  /* 增加内边距 */
  }
}

/* 在移动端适配 */
@media (max-width: 1024px) {
  #app {
    padding: 10px;  /* 在移动端减小内边距 */
  }
}
</style>
