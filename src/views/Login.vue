<template>
  <div class="min-h-[calc(100vh-56px)] w-full bg-[#0A0F1E] relative flex items-center justify-center overflow-hidden font-sans selection:bg-cyan-500/30">

    <div class="absolute inset-0 z-0 pointer-events-none">
      <div class="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full
                  bg-gradient-to-r from-blue-900/40 to-indigo-900/40 blur-[120px] animate-blob"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full
                  bg-gradient-to-l from-cyan-900/30 to-blue-900/30 blur-[100px] animate-blob animation-delay-2000"></div>

      <svg class="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(100, 200, 255, 0.3)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      <div v-for="i in 15" :key="i"
           class="particle absolute rounded-full bg-cyan-400 glow-particle"
           :style="getParticleStyle(i)">
      </div>
    </div>

    <div class="relative z-10 w-full max-w-[1280px] px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">

      <div class="hidden lg:flex flex-col justify-center relative">
        <div class="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"></div>

        <div class="mb-10 animate-fade-in-up">
          <div class="flex items-center space-x-2 mb-4">
             <span class="flex h-2 w-2 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
             </span>
            <span class="font-mono text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">System Online</span>
          </div>

          <h1 class="font-black tracking-tight leading-none text-white">
            <span class="block text-5xl xl:text-7xl mb-1">INTELLIGENCE</span>
            <span class="block text-5xl xl:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
               NATIVE
             </span>
          </h1>

          <h2 class="mt-6 text-2xl font-light tracking-[0.15em] text-white/90 border-l-4 border-cyan-500 pl-4">
            数智赋能 <span class="mx-2 text-cyan-500">·</span> AI 原生平台
          </h2>

          <p class="mt-4 text-sm font-mono text-blue-200/60 max-w-lg leading-relaxed uppercase tracking-wider">
            Powering the future of industrial diagnostics.<br>
            Data-driven · Algorithm-centered · Infinite Scale
          </p>
        </div>

        <div class="relative w-[400px] h-[400px] -ml-8 animate-float-slow opacity-90">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <circle cx="200" cy="200" r="180" stroke="url(#paint0_linear)" stroke-width="1" stroke-dasharray="10 10" class="animate-spin-slow opacity-30"/>
            <circle cx="200" cy="200" r="130" stroke="url(#paint1_linear)" stroke-width="1.5" stroke-dasharray="50 200" class="animate-spin-reverse-slower opacity-50"/>

            <g class="animate-pulse-slow">
              <circle cx="200" cy="200" r="60" fill="url(#paint2_radial)" />
              <circle cx="200" cy="200" r="60" stroke="#22d3ee" stroke-width="2" class="blur-[2px] opacity-60"/>
            </g>

            <g class="nodes">
              <path d="M200 140 L200 60" stroke="#38bdf8" stroke-width="2" class="data-flow"/>
              <circle cx="200" cy="60" r="8" fill="#22d3ee" class="glow-node"/>
              <path d="M245 165 L310 110" stroke="#38bdf8" stroke-width="2" class="data-flow animation-delay-500"/>
              <circle cx="310" cy="110" r="6" fill="#3b82f6" class="glow-node animation-delay-500"/>
              <path d="M155 235 L90 290" stroke="#38bdf8" stroke-width="2" class="data-flow animation-delay-1000"/>
              <circle cx="90" cy="290" r="7" fill="#22d3ee" class="glow-node animation-delay-1000"/>
            </g>

            <defs>
              <linearGradient id="paint0_linear" x1="20" y1="200" x2="380" y2="200" gradientUnits="userSpaceOnUse">
                <stop stop-color="#22d3ee" stop-opacity="0"/>
                <stop offset="0.5" stop-color="#22d3ee"/>
                <stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="paint1_linear" x1="330" y1="200" x2="70" y2="200" gradientUnits="userSpaceOnUse">
                <stop stop-color="#3b82f6"/>
                <stop offset="1" stop-color="#06b6d4"/>
              </linearGradient>
              <radialGradient id="paint2_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 200) rotate(90) scale(60)">
                <stop stop-color="#22d3ee"/>
                <stop offset="0.8" stop-color="#3b82f6" stop-opacity="0.4"/>
                <stop offset="1" stop-color="#1d4ed8" stop-opacity="0"/>
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div class="flex items-center justify-center lg:justify-end w-full">
        <div class="login-card-modern w-full max-w-[440px]">

          <div class="lg:hidden text-center mb-8 animate-fade-in-down">
            <h2 class="text-3xl font-black text-white tracking-tighter">INTELLIGENCE<br><span class="text-cyan-400">NATIVE</span></h2>
            <p class="text-xs text-blue-200/60 mt-2 uppercase tracking-widest">AI Device Diagnosis Platform</p>
          </div>

          <div class="glass-panel relative p-8 sm:p-10 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] animate-slide-in-right overflow-hidden group">

            <div class="absolute top-0 left-[-100%] w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent group-hover:animate-scan-line opacity-50"></div>

            <div class="mb-8">
              <h3 class="text-2xl font-bold text-white tracking-wide">User Login</h3>
              <p class="text-sm text-slate-400 mt-1">用户身份认证</p>
            </div>

            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="tech-form space-y-6">

              <el-form-item prop="username">
                <el-input
                    v-model="form.username"
                    placeholder="Account / 账号"
                    :prefix-icon="User"
                    class="h-12"
                />
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                    v-model="form.password"
                    type="password"
                    show-password
                    placeholder="Password / 密码"
                    :prefix-icon="Lock"
                    class="h-12"
                />
              </el-form-item>

              <div class="flex items-center justify-between text-sm">
                <el-checkbox v-model="rememberMe" size="small">
                  <span class="text-blue-200/80 font-sans">Remember me / 记住我</span>
                </el-checkbox>
                <a href="#" class="text-cyan-400 hover:text-cyan-300 transition-colors text-xs font-mono">FORGOT PWD?</a>
              </div>

              <button
                  type="button"
                  @click="onSubmit"
                  class="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold tracking-widest uppercase shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 relative overflow-hidden group"
              >
                  <span class="relative z-10 flex items-center justify-center">
                     Login System <span class="mx-2 opacity-50">|</span> 登 录
                     <el-icon class="ml-2 group-hover:translate-x-1 transition-transform"><Right /></el-icon>
                  </span>
                <div class="absolute inset-0 h-full w-full scale-0 rounded-xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10"></div>
              </button>
            </el-form>

            <div class="mt-8 flex justify-between items-center text-[10px] text-blue-200/30 font-mono uppercase">
              <span>Ver 4.0.2 Stable</span>
              <span>Security Protocol: TLS 1.3</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import Cookies from 'js-cookie'
import { getToken } from '@/utils/auth'
import { User, Lock, Right } from '@element-plus/icons-vue'

const router = useRouter()
const store = useStore()
const formRef = ref()
const form = reactive({ username: '', password: '' })
const rememberMe = ref(false)

const rules = {
  username: [{ required: true, message: 'Please enter username / 请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter password / 请输入密码', trigger: 'blur' }],
}

const onSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    const token = getToken()
    if (token) {
      ElMessage.success('Redirecting... / 正在跳转...')
      router.push('/inner/home')
      return
    }
    const userInfo = { username: form.username, password: form.password, tenantId: 180, type: 'username' }
    try {
      await store.dispatch('Login', userInfo)
      ElMessage.success('Login Success / 登录成功')
      if (rememberMe.value) {
        Cookies.set('remember_username', form.username, { expires: 7 })
        Cookies.set('remember_password', form.password, { expires: 7 })
      } else {
        Cookies.remove('remember_username')
        Cookies.remove('remember_password')
      }
      router.push('/inner/home')
    } catch (e) {
      ElMessage.error('Login Failed / 登录失败')
      console.error(e)
    }
  })
}

onMounted(() => {
  const u = Cookies.get('remember_username')
  const p = Cookies.get('remember_password')
  if (u && p) {
    form.username = u
    form.password = p
    rememberMe.value = true
  }
})

// 生成随机粒子的样式
const getParticleStyle = (i) => {
  const size = Math.random() * 4 + 1 + 'px'
  return {
    width: size,
    height: size,
    top: Math.random() * 100 + '%',
    left: Math.random() * 100 + '%',
    opacity: Math.random() * 0.5 + 0.2,
    animation: `floatParticle ${Math.random() * 10 + 10}s infinite linear alternate-reverse`,
    animationDelay: `-${Math.random() * 5}s`
  }
}
</script>

<style scoped>
/* ================== 动画定义 ================== */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob { animation: blob 20s infinite ease-in-out; }
.animation-delay-2000 { animation-delay: 2s; }

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow { animation: spin-slow 60s linear infinite; transform-origin: center center; }

@keyframes spin-reverse-slower {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}
.animate-spin-reverse-slower { animation: spin-reverse-slower 80s linear infinite; transform-origin: center center; }

@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
.animate-float-slow { animation: float-slow 8s ease-in-out infinite; }

@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.95); }
}
.animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

/* 数据流动画 */
@keyframes data-flow-dash { to { stroke-dashoffset: -100; } }
.data-flow { stroke-dasharray: 5 5; animation: data-flow-dash 3s linear infinite; }

/* 粒子与进入动画 */
@keyframes floatParticle {
  0% { transform: translateY(0) translateX(0); }
  100% { transform: translateY(-100px) translateX(50px); }
}
.glow-particle { box-shadow: 0 0 6px 1px rgba(34, 211, 238, 0.6); }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}
.animate-slide-in-right { animation: slideInRight 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }

@keyframes scan-line {
  0% { left: -100%; }
  100% { left: 200%; }
}
.group-hover\:animate-scan-line:hover {
  animation: scan-line 2s linear infinite;
}

/* ================== Element Plus 样式定制 ================== */
.tech-form :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(103, 232, 249, 0.15) !important;
  border-radius: 12px;
  padding: 2px 15px;
  box-shadow: none !important;
  transition: all 0.3s ease;
}

.tech-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(103, 232, 249, 0.4) !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.tech-form :deep(.el-input__wrapper.is-focus) {
  border-color: #22d3ee !important;
  box-shadow: 0 0 0 1px #22d3ee, 0 0 15px rgba(34, 211, 238, 0.2) !important;
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.tech-form :deep(.el-input__inner) {
  color: #e0f2fe !important;
  font-size: 15px;
  letter-spacing: 0.5px;
}
.tech-form :deep(.el-input__inner::placeholder) { color: rgba(147, 197, 253, 0.4); font-size: 13px;}
.tech-form :deep(.el-input__icon) { color: rgba(147, 197, 253, 0.6); }

/* Checkbox */
.tech-form :deep(.el-checkbox__inner) {
  background-color: transparent;
  border-color: rgba(103, 232, 249, 0.3);
}
.tech-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #22d3ee;
  border-color: #22d3ee;
}
.tech-form :deep(.el-checkbox__label) { padding-left: 8px; }
</style>