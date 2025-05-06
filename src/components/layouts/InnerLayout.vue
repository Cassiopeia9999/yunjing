<template>
  <div class="relative h-screen w-full">
    <!-- 菜单栏（fixed 占位） -->
    <SideMenu
        v-if="isMenuVisible"
        class="fixed top-0 left-0 h-full w-[286px] z-50"
        @toggle-menu="toggleMenu"
    />

    <!-- 主内容区域（动态 margin）-->
    <div :class="['flex flex-col h-full transition-all duration-300', isMenuVisible ? 'ml-[286px]' : 'ml-0']">
      <TopBar @toggle-menu="toggleMenu" />
      <main class="flex-1 p-1 overflow-auto">
        <router-view />
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
