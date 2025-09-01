<!-- src/components/layouts/TopBar.vue -->
<template>
  <header class="topbar w-full h-12 relative flex items-center justify-between px-3 md:px-4">
    <!-- 左：菜单按钮（轻微霓虹） -->
    <el-button
        @click="toggleMenu"
        type="text"
        :icon="Grid"
        circle
        class="icon-btn"
        :style="{ fontSize: '20px' }"
        title="展开/收起菜单"
    />

    <!-- 中：标题 + 搜索 -->
    <div class="flex items-center gap-3 min-w-0">
      <div class="title truncate">故障诊断工作台</div>

      <!-- 搜索（可收缩） -->
      <div class="hidden md:flex items-center">
        <div class="search-wrap">
          <i class="i-ep-search mr-2 opacity-70"></i>
          <input
              type="text"
              placeholder="在 故障 中搜索"
              class="search-input"
          />
        </div>
      </div>
    </div>

    <!-- 右：CTA + 主题开关 + 头像/退出 -->
    <div class="flex items-center gap-2">
<!--      <button class="btn-neon" @click="$emit('request')">请求</button>-->
<!--      <button class="btn-neon" @click="$emit('ai')">云效+DeepSeek</button>-->
      <!-- 新增：大屏按钮（图标 + 文字） -->
      <el-button
          circle
          type="text"
          class="icon-btn"
          size="small"
          @click="openBigScreen"
          title="打开大屏"
      >
        <el-icon><Monitor /></el-icon>
      </el-button>


      <!-- 主题切换 -->
      <ThemeToggle />

      <el-button
          @click="confirmLogout"
          type="text"
          :icon="User"
          circle
          class="icon-btn"
          :style="{ fontSize: '20px' }"
          title="退出登录"
      />
    </div>

    <!-- 底部发光分隔线 -->
    <div class="neon-divider" />
  </header>
</template>

<script setup>
import { defineEmits } from 'vue'
import {Grid, Monitor, User} from '@element-plus/icons-vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import ThemeToggle from '@/components/ThemeToggle.vue'

const emit = defineEmits(['toggle-menu', 'request', 'ai'])
const store = useStore()
const router = useRouter()

const toggleMenu = () => emit('toggle-menu')

const confirmLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '退出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
      .then(() => logout())
      .catch(() => {})
}

function openBigScreen() {
  // 解析为可用 URL，然后新开标签页
  const url = router.resolve({ name: 'DashboardFull' }).href
  window.open(url, '_blank')
}

const logout = async () => {
  try {
    await store.dispatch('LogOut')
    router.push('/')
  } catch (e) {
    console.error('退出登录失败:', e)
  }
}
</script>

<style scoped>
/* ====== 顶栏主体（玻璃质感 + 渐变光膜） ====== */
.topbar{
  @apply sticky top-0 z-30 backdrop-blur;
  @apply border-b border-white/20 dark:border-white/5;
  @apply bg-white/70 text-neutral-900;
  @apply dark:bg-[#0B1220]/85 dark:text-slate-200;
}
.topbar::before{
  /* 光膜：左侧青色高光 + 横向冷色渐变 */
  content:"";
  position:absolute; inset:0; pointer-events:none;
  background-image:
      radial-gradient(220px 120px at 4% 50%, rgba(34,211,238,.16), transparent),
      linear-gradient(90deg, rgba(14,165,233,.07), rgba(37,99,235,.05));
}
:global(html.dark) .topbar::before{
  background-image:
      radial-gradient(260px 140px at 4% 50%, rgba(34,211,238,.22), transparent),
      linear-gradient(90deg, rgba(14,165,233,.10), rgba(37,99,235,.06));
}

/* 底部分隔线：青→蓝 发光细线 */
.neon-divider{
  position:absolute; left:0; right:0; bottom:-1px; height:2px;
  background: linear-gradient(90deg, transparent, #22d3ee, #60a5fa, transparent);
  filter: drop-shadow(0 0 6px rgba(34,211,238,.6));
  opacity:.9;
}

/* 标题 */
.title{
  @apply text-base md:text-lg font-semibold tracking-tight;
  @apply text-slate-800 dark:text-slate-100;
}

/* ====== 搜索（胶囊 + 霓虹描边） ====== */
.search-wrap{
  @apply h-9 flex items-center px-3 rounded-full;
  @apply bg-white/75 text-slate-800 shadow-sm;
  @apply ring-1 ring-slate-300/60 focus-within:ring-2 focus-within:ring-blue-400/70;
  @apply dark:bg-slate-900/70 dark:text-slate-100;
  @apply dark:ring-white/10 dark:focus-within:ring-cyan-300/70;
  backdrop-filter: blur(6px);
  transition: box-shadow .15s ease, transform .15s ease;
}
.search-wrap:focus-within{ transform: translateY(-1px); }
.search-input{
  @apply bg-transparent outline-none w-56 md:w-64 text-sm;
  @apply placeholder-slate-400 dark:placeholder-slate-400;
  -webkit-text-fill-color: inherit;
}

/* ====== 图标按钮（左菜单/右用户） ====== */
.icon-btn{
  @apply text-blue-600 dark:text-cyan-300;
  @apply hover:text-blue-700 dark:hover:text-cyan-200;
  @apply transition;
  position: relative;
}
.icon-btn::after{
  /* 轻微霓虹晕圈 */
  content:""; position:absolute; inset:-6px; border-radius:9999px;
  border:1px solid transparent;
  background: radial-gradient(40% 40% at 50% 50%, rgba(34,211,238,.25), transparent);
  opacity:0; transition:.18s ease;
}
.icon-btn:hover::after{ opacity:.9; }

/* ====== CTA 霓虹按钮（与侧栏风格统一） ====== */
.btn-neon{
  @apply h-9 px-3 rounded-md text-white text-sm font-medium;
  background-image: linear-gradient(90deg, #22d3ee, #60a5fa);
  box-shadow:
      0 6px 18px rgba(2,132,199,.25),
      inset 0 0 0 1px rgba(255,255,255,.15);
  transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
}
.btn-neon:hover{
  transform: translateY(-1px);
  filter: saturate(1.08);
  box-shadow:
      0 10px 28px rgba(2,132,199,.35),
      inset 0 0 0 1px rgba(255,255,255,.2);
}
.btn-neon:active{ transform: translateY(0); }
:global(html.light) .btn-neon{ color:#fff; }
:global(html.dark)  .btn-neon{ color:#0b1220; font-weight:600; }

/* 小屏收紧：标题与搜索间距 */
@media (max-width: 768px){
  .title{ @apply text-base; }
}
</style>
