<template>
  <div
      class="relative h-full w-full overflow-hidden
           bg-white text-neutral-900
           dark:bg-neutral-950 dark:text-neutral-100
           transition-colors"
  >
    <!-- 左侧菜单（fixed） -->
    <SideMenu
        v-if="isMenuVisible"
        class="fixed top-0 left-0 h-full w-[196px] z-50"
        @toggle-menu="toggleMenu"
    />

    <!-- 主内容（随菜单展开收起动态让出空间） -->
    <div
        :class="[
        // ✅ 关键：允许子项收缩 + 自己不滚动
        'flex flex-col h-full min-h-0 overflow-hidden transition-all duration-300',
        isMenuVisible ? 'ml-[196px]' : 'ml-0'
      ]"
    >
      <TopBar @toggle-menu="toggleMenu" />

      <!-- ✅ 唯一滚动容器 -->
      <main
          class="flex-1 min-h-0 overflow-auto p-1
               bg-neutral-50 dark:bg-neutral-900
               transition-colors"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import TopBar from '@/components/layouts/TopBar.vue'
import SideMenu from '@/components/layouts/SideMenu.vue'

/**
 * 菜单展开/收起状态（保留 & 支持持久化）
 * - 初始值：从 localStorage 读取（默认展开）
 * - 切换时：写回 localStorage
 */
const KEY = 'menu-visible'
const isMenuVisible = ref(localStorage.getItem(KEY) !== '0')

const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value
  localStorage.setItem(KEY, isMenuVisible.value ? '1' : '0')
}
</script>

<style scoped>
/* 可选：滚动条在深色模式下更柔和（按需保留） */
:deep(::-webkit-scrollbar) {
  height: 8px;
  width: 8px;
}
:deep(::-webkit-scrollbar-thumb) {
  background: rgba(120, 120, 120, 0.4);
  border-radius: 4px;
}
:deep(html.dark) ::-webkit-scrollbar-thumb {
  background: rgba(160, 160, 160, 0.3);
}
</style>
