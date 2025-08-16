<template>
  <!-- 占满视口（减去顶栏 56px），禁止滚动 -->
  <div
      class="relative w-full h-[calc(100vh-56px)] overflow-hidden
           bg-center bg-cover"
      style="background-image: url('/images/login-bg.png')"
  >
    <!-- 暗化遮罩 -->
    <div class="absolute inset-0 bg-black/20 dark:bg-black/40"></div>

    <!-- 科技感光斑 -->
    <div class="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl"></div>

    <!-- 内容：右侧对齐，并整体往右一点 -->
    <div class="login-spot">
      <div class="login-card w-[460px] max-w-[92vw] px-8 py-5 rounded-2xl
            backdrop-blur-xl bg-white/60 dark:bg-neutral-900/60
            ring-1 ring-white/30 dark:ring-white/10
            shadow-[0_12px_48px_rgba(0,0,0,.35)]">
      >
        <!-- 顶部标识 -->
        <div class="text-center mb-6">
          <div class="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/30"></div>
          <h2 class="mt-3 text-2xl font-bold">欢迎登录</h2>
          <p class="text-xs opacity-70">AI 设备故障诊断平台</p>
        </div>

        <!-- 表单 -->
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="space-y-3">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" size="large" clearable placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" size="large" type="password" show-password placeholder="请输入密码" />
          </el-form-item>

          <div class="flex items-center justify-between mb-1">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-link :underline="false" type="primary">忘记密码？</el-link>
          </div>

          <el-button type="primary" size="large" class="w-full mt-1" @click="onSubmit">登 录</el-button>

          <div class="mt-4 text-xs opacity-70">
            建议浏览器：Chrome / Edge 最新版
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import Cookies from 'js-cookie'
import { getToken } from '@/utils/auth'

const router = useRouter()
const store = useStore()
const formRef = ref()
const form = ref({ username: '', password: '' })
const rememberMe = ref(false)

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const onSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    const token = getToken()
    if (token) {
      ElMessage.success('您已登录，正在跳转...')
      router.push('/inner/dashboard')
      return
    }
    const userInfo = { username: form.value.username, password: form.value.password, tenantId: 180, type: 'username' }
    try {
      await store.dispatch('Login', userInfo)
      ElMessage.success('登录成功，欢迎回来！')
      if (rememberMe.value) {
        Cookies.set('remember_username', form.value.username, { expires: 7 })
        Cookies.set('remember_password', form.value.password, { expires: 7 })
      } else {
        Cookies.remove('remember_username')
        Cookies.remove('remember_password')
      }
      router.push('/inner/dashboard')
    } catch (e) {
      ElMessage.error('登录失败，请检查用户名或密码')
      console.error(e)
    }
  })
}

onMounted(() => {
  const u = Cookies.get('remember_username')
  const p = Cookies.get('remember_password')
  if (u && p) {
    form.value.username = u
    form.value.password = p
    rememberMe.value = true
  }
})
</script>
<style scoped>
/* ===================== 定位 ===================== */
.login-spot{
  position: absolute;
  right: 6%;
  top: 24%;
  z-index: 10;
}
@media (min-width: 1536px){ .login-spot{ right: 7%; top: 22%; } }
@media (max-width: 1024px){
  .login-spot{ right: auto; left: 50%; top: 14%; transform: translateX(-50%); }
}

/* ===================== 卡片与动效 ===================== */
.login-card{
  will-change: transform, box-shadow, filter;
  transform-style: preserve-3d;
  animation: floaty 9s ease-in-out infinite;
  /* 统一控件圆角与 EP 变量 */
  --el-border-radius-base: 6px;
  --el-input-bg-color: transparent;
  --el-input-border-color: transparent;
  --el-fill-color-blank: transparent;
}
.login-card:hover{
  transform: translate3d(0, -6px, 0) rotateX(1.25deg) rotateY(-1.25deg);
  box-shadow: 0 18px 56px rgba(0,0,0,.45);
}
/* 科技感光晕 */
.login-card::before{
  content:"";
  position:absolute; inset:-1px;
  border-radius:16px;
  background:linear-gradient(135deg, rgba(34,211,238,.7), rgba(59,130,246,.7));
  filter:blur(8px); opacity:.42; z-index:-1;
}
@keyframes floaty{
  0%{transform:translate3d(0,0,0)}
  50%{transform:translate3d(0,-8px,0)}
  100%{transform:translate3d(0,0,0)}
}

/* ===================== 表单与输入框 ===================== */
/* 顶部标签更清晰 */
:deep(.el-form--label-top .el-form-item__label){
  color:rgba(255,255,255,.92); font-weight:500; letter-spacing:.2px; margin-bottom:6px;
}
/* 输入框玻璃底色（唯一入口） */
:deep(.el-input__wrapper){
  border-radius:var(--el-border-radius-base) !important;
  padding:0 12px;
  min-height:44px;
  background-color:rgba(255,255,255,.14);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.28);
  backdrop-filter:blur(8px);
  overflow:hidden; /* 裁掉一切内部背景 */
}
:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus){
  background-color:rgba(255,255,255,.20);
  box-shadow:
      inset 0 0 0 1.5px rgba(96,165,250,.9),
      0 0 0 2px rgba(96,165,250,.25);
}
/* 去掉内部白底与 Safari 渲染 */
:deep(.el-input__inner){
  background-color:transparent !important;
  -webkit-text-fill-color:inherit;
}
/* 去除 EP 拼边的伪元素（避免左右半圆块） */
:deep(.el-input__wrapper::before),
:deep(.el-input__wrapper::after){
  display:none !important; content:none !important;
}
/* 前后缀容器保持透明，避免右侧“眼睛”更亮 */
:deep(.el-input__prefix),
:deep(.el-input__suffix){
  background:transparent !important;
  border-radius:0 !important;
  padding:0 6px;
}
/* 图标与占位符颜色（深浅色分别处理） */
:deep(.el-input__suffix .el-input__icon){ color:rgba(255,255,255,.82); }
:deep(html:not(.dark) .el-input__suffix .el-input__icon){ color:rgba(0,0,0,.55); }

:deep(html.dark .el-input__inner::placeholder){ color:rgba(255,255,255,.65); }
:deep(html:not(.dark) .el-input__inner::placeholder){ color:rgba(0,0,0,.45); }
</style>

