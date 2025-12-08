<!-- src/components/layouts/SideMenu.vue -->
<template>
  <aside
      class="w-[196px] h-full shrink-0
         backdrop-blur bg-white/60 dark:bg-[#0A0F1A]/90
         border-r border-white/20 dark:border-white/5
         shadow-[0_12px_32px_rgba(0,0,0,.25)]">


  <!-- 顶部：标题 + 折叠按钮 -->
    <div
        class="flex items-center h-12 px-3
             text-slate-900 dark:text-slate-100
             border-b border-white/20 dark:border-white/10"
    >
      <el-button
          @click="toggleMenu"
          type="text"
          :icon="Grid"
          class="!text-cyan-400 !p-1 !m-0 mr-2"
          :style="{ fontSize: '20px' }"
          aria-label="折叠菜单"
      />
      <span class="font-semibold tracking-wide">菜单</span>
    </div>

    <!-- 菜单项（替换整个 <nav> 块） -->
    <nav class="p-2 space-y-1">
      <button
          v-for="(item, idx) in menuItems"
          :key="idx"
          @click="handleMenuClick(item)"
          :aria-current="isActive(item) ? 'page' : undefined"
          class="group relative w-full h-11 px-3 rounded-md flex items-center gap-3 transition
           focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          :class="[
      // ✅ 选中态
      isActive(item)
        // 浅色：清晰蓝色高对比
        ? 'font-medium text-blue-700 bg-blue-50 ring-1 ring-blue-200 ' +
          // 深色：更亮的青蓝渐变 + 明显描边 + 轻微外发光
          'dark:text-slate-900 dark:bg-[radial-gradient(120px_80px_at_0%_50%,rgba(34,211,238,.28),transparent),linear-gradient(to_right,rgba(14,165,233,.26),rgba(37,99,235,.18))] ' +
          'dark:ring-1 dark:ring-cyan-300/70 dark:shadow-[0_6px_24px_rgba(0,0,0,.5),0_0_0_1px_rgba(255,255,255,.04)]'
        // ✅ 未选中态
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 ' +
          'dark:text-slate-300 dark:hover:text-slate-900 ' +
          // 深色：移入时浅发光 + 轻描边，提升对比
          'dark:hover:bg-[linear-gradient(to_right,rgba(14,165,233,.12),rgba(37,99,235,.08))] ' +
          'dark:hover:ring-1 dark:hover:ring-cyan-300/35'
    ]"
      >
        <!-- 左侧发光条：加粗并提高亮度，深浅分开控制 -->
        <span
            class="absolute left-1.5 top-1/2 -translate-y-1/2 rounded transition
             w-1.5 h-5 opacity-0 group-hover:opacity-100
             bg-gradient-to-b from-blue-500 to-sky-400 shadow-[0_0_10px_rgba(59,130,246,.55)]"
            :class="[
        // 深色更亮的青色发光
        'dark:from-cyan-300 dark:to-sky-400 dark:shadow-[0_0_14px_rgba(34,211,238,.9)]',
        isActive(item) ? 'opacity-100' : ''
      ]"
        />

        <!-- 图标：选中/移入时浅色蓝、深色白/青 -->
        <el-icon
            class="text-[18px] transition"
            :class="isActive(item)
        ? 'text-blue-600 dark:text-cyan-200'
        : 'text-slate-400 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-cyan-200'"
        >
          <component :is="item.icon" />
        </el-icon>

        <span class="truncate text-[14px]">{{ item.name }}</span>

        <!-- 外链标记 -->
        <span
            v-if="item.external"
            class="ml-auto text-xs opacity-70 text-slate-500 dark:text-slate-300"
            title="外部链接"
        >↗</span>
      </button>
    </nav>


  </aside>
</template>

<script setup>
import { defineEmits, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Grid } from '@element-plus/icons-vue'

const emit = defineEmits(['toggle-menu'])
const toggleMenu = () => emit('toggle-menu')

const router = useRouter()
const route  = useRoute()

const menuItems = [
  // 仪表盘 / 工作台
  { name: '工作台',   icon: 'Odometer',     link: '/inner/dashboard' }
]


const isActive = (item) => !item.external && route.path.startsWith(item.link)

const handleMenuClick = (item) => {
  if (!item.external) {
    router.push(item.link)
    return
  }
}


</script>

<!-- 纯 Tailwind，这里无需样式 -->
<style scoped></style>
