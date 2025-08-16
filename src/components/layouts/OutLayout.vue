<template>
  <div
      class="min-h-screen w-full
           bg-white text-neutral-900
           dark:bg-neutral-950 dark:text-neutral-100
           transition-colors
           flex flex-col"
  >
    <!-- 顶部导航（统一放这里） -->
    <el-header
        class="sticky top-0 z-40 backdrop-blur
             bg-white/80 dark:bg-neutral-900/80
             border-b border-transparent
             shrink-0"
        height="56px"
    >
      <div class="max-w-7xl mx-auto h-14 px-4 flex items-center justify-between">
        <!-- 左：Logo + 名称 -->
        <div class="flex items-center gap-2 min-w-0">
          <img src="/images/logo.svg" alt="logo" class="h-6 w-6" />
          <span class="font-semibold truncate">AI 设备故障诊断平台</span>
        </div>

        <!-- 中：横向菜单（路由联动高亮） -->
        <el-menu
            router
            :default-active="activePath"
            mode="horizontal"
            class="!bg-transparent border-0 hidden md:flex"
            background-color="transparent"
            text-color="var(--el-text-color-regular)"
            active-text-color="#7dd3fc"
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/inner/dashboard">业务总览</el-menu-item>
          <el-menu-item index="/inner/globalview">地图视图</el-menu-item>
          <el-menu-item index="/docs">文档</el-menu-item>
        </el-menu>

        <!-- 右：主题开关 + CTA -->
        <div class="flex items-center gap-3">
          <ThemeToggle />
          <el-button size="small" type="primary" @click="goLogin">进入系统</el-button>
        </div>
      </div>

      <!-- 顶栏底部发光渐变线（科技感） -->
      <div class="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"></div>
    </el-header>

    <!-- 主内容（唯一滚动容器） -->
    <main
        class="flex-1 w-full p-0
             overflow-y-auto
             bg-gray-50 dark:bg-neutral-900
             text-neutral-900 dark:text-neutral-100
             transition-colors"
    >
      <router-view class="block w-full" />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'

const route = useRoute()
const router = useRouter()

// 菜单高亮使用当前路径
const activePath = computed(() => route.path)

const goLogin = () => router.push('/login')
</script>

<style scoped>
/* Element Plus 横向菜单的“科技感”高亮：发光下划线 + 细微过渡 */
:deep(.el-menu--horizontal > .el-menu-item) {
  height: 56px;
  line-height: 56px;
  position: relative;
  transition: color .2s ease;
  padding: 0 14px;
}
:deep(.el-menu--horizontal > .el-menu-item.is-active),
:deep(.el-menu--horizontal > .el-menu-item:hover) {
  color: #7dd3fc !important; /* 青色 */
}
:deep(.el-menu--horizontal > .el-menu-item.is-active::after),
:deep(.el-menu--horizontal > .el-menu-item:hover::after) {
  content: "";
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 6px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg,#22d3ee, #60a5fa);
  box-shadow: 0 0 8px rgba(34,211,238,.6);
}
</style>
