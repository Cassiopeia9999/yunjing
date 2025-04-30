<template>
  <div class="flex h-screen w-full">
    <!-- 左侧菜单栏 -->
    <SideMenu v-if="isMenuVisible"  @toggle-menu="toggleMenu" />
    <!-- 主内容区域 -->
    <div class="flex flex-col w-full">
      <!-- 顶部信息栏 -->
      <TopBar @toggle-menu="toggleMenu" />
      <!-- 内容区域 -->
      <main class="flex-1 p-4 overflow-auto">
        <router-view />  <!-- 子路由的视图会在这里渲染 -->
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TopBar from '@/components/layouts/TopBar.vue';  // 顶部信息栏组件
import SideMenu from '@/components/layouts/SideMenu.vue';  // 左侧菜单组件

// 控制菜单显示与隐藏
const isMenuVisible = ref(false);

// 切换菜单显示与隐藏
const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value;
};
</script>

<style scoped>
/* 确保布局的容器充满整个视口 */
#app {
  display: flex;
  height: 100vh;
}
</style>
