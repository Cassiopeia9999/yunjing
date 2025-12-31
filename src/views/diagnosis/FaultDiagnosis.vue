<template>
  <div class="home w-full overflow-x-hidden
            bg-white text-neutral-900
            dark:bg-neutral-950 dark:text-neutral-100 transition-colors">
  <!-- Hero：主题横幅 -->
    <section class="relative">
      <div class="relative h-[62vh] w-full">
        <img src="/images/earthnight.png" class="absolute inset-0 w-full h-full object-cover opacity-90
                                                dark:opacity-60" alt="hero"
             onerror="this.style.display='none'"/>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40
                    dark:from-transparent dark:via-black/40 dark:to-black/60"></div>

        <div class="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
          <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight">
            为设备健康而生的
            <span class="text-blue-500 dark:text-blue-400">AI 故障诊断与维修决策</span>
          </h1>
          <p class="mt-5 text-base md:text-lg opacity-90 max-w-3xl">
            从特征 → 诊断 → 预测 → 告警 → 决策 → 工单闭环。
            实时识别风险、量化剩余寿命（RUL）、一键生成维修方案。
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <el-button type="primary" size="large" @click="goDashboard">立即体验</el-button>
            <el-button size="large" @click="goLogin">登录/注册</el-button>
            <el-button size="large" text @click="goMap">查看地图总览</el-button>
          </div>
        </div>
      </div>

      <!-- 四个核心 KPI（演示用静态/可替换为真实） -->
      <div class="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <el-card v-for="k in kpis" :key="k.label" shadow="hover"
                   class="dark:bg-neutral-900/80">
            <div class="text-xs opacity-70 mb-1">{{ k.label }}</div>
            <div class="text-2xl font-semibold">{{ k.value }}</div>
            <div class="text-xs opacity-60 mt-1">{{ k.desc }}</div>
          </el-card>
        </div>
      </div>
    </section>

    <!-- 能力矩阵：映射你的 10 大功能点 -->
    <section class="max-w-7xl mx-auto px-4 mt-14">
      <h2 class="text-2xl md:text-3xl font-bold mb-6">平台能力矩阵</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
            v-for="f in featureList"
            :key="f.title"
            :title="f.title"
            :desc="f.desc"
            :icon="f.icon"
            :to="f.to"
        />
      </div>
    </section>

    <!-- 从特征到处置：流程一图懂 -->
    <section class="max-w-7xl mx-auto px-4 mt-16">
      <h2 class="text-2xl md:text-3xl font-bold mb-6">从「特征」到「维修闭环」</h2>
      <el-steps :active="7" align-center finish-status="success" class="bg-transparent">
        <el-step title="数据接入" description="通道/特征上报"/>
        <el-step title="特征解析" description="质量校验与入库"/>
        <el-step title="状态甄别" description="Normal/Warning/Fault"/>
        <el-step title="故障诊断" description="多点分析·置信度输出"/>
        <el-step title="设备预测" description="RUL/HI/趋势&稳定性"/>
        <el-step title="告警联动" description="规则阈值&知识库"/>
        <el-step title="维修决策" description="策略对比→生成工单"/>
      </el-steps>
      <div class="mt-6 grid md:grid-cols-3 gap-4">
        <el-card class="dark:bg-neutral-900/80">
          <div class="font-medium mb-1">实时识别</div>
          <div class="text-sm opacity-80">按配置映射 X/Y 特征，输出状态点与置信度。</div>
        </el-card>
        <el-card class="dark:bg-neutral-900/80">
          <div class="font-medium mb-1">诊断证据沉淀</div>
          <div class="text-sm opacity-80">诊断记录与原始文件一键溯源，支撑研判与复核。</div>
        </el-card>
        <el-card class="dark:bg-neutral-900/80">
          <div class="font-medium mb-1">一键决策</div>
          <div class="text-sm opacity-80">带 RUL/HI/置信度，输出成本/时间/配件对比方案。</div>
        </el-card>
      </div>
    </section>

    <!-- 为什么选择我们（面向诊断业务） -->
    <section class="max-w-7xl mx-auto px-4 mt-16 mb-20">
      <h2 class="text-2xl md:text-3xl font-bold mb-6">为什么选择我们的诊断平台？</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <el-card class="dark:bg-neutral-900/80">
          <div class="font-medium">准确 + 可解释</div>
          <div class="text-sm opacity-80 mt-1">
            诊断概率 + 依据 + 原始文件回放；阈值与分档口径页面内可见，决策更安心。
          </div>
        </el-card>
        <el-card class="dark:bg-neutral-900/80">
          <div class="font-medium">可追溯 + 可复现</div>
          <div class="text-sm opacity-80 mt-1">
            任一故障可回溯到诊断记录与特征证据；任一诊断能复现实验当时条件。
          </div>
        </el-card>
        <el-card class="dark:bg-neutral-900/80">
          <div class="font-medium">实时总览 + 快速下钻</div>
          <div class="text-sm opacity-80 mt-1">
            总览 → 基地 → 装置 → 设备 分层穿透；高风险榜单定位优先处置对象。
          </div>
        </el-card>
        <el-card class="dark:bg-neutral-900/80">
          <div class="font-medium">开放接入 + 弹性部署</div>
          <div class="text-sm opacity-80 mt-1">
            低代码可视化配置，支持 SaaS/专有云/私有化，轻松对接现有系统。
          </div>
        </el-card>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'

// 小卡片组件（本文件内局部注册）
const FeatureCard = {
  props: { title: String, desc: String, icon: String, to: String },
  setup(props) {
    const router = useRouter()
    const go = () => props.to && router.push(props.to)
    return { go, props }
  },
  template: `
    <div class="group cursor-pointer" @click="go">
      <el-card shadow="hover" class="h-full dark:bg-neutral-900/80">
        <div class="flex items-start gap-3">
          <div class="h-10 w-10 rounded-md flex items-center justify-center
                      bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300
                      group-hover:scale-105 transition">
            <i :class="props.icon"></i>
          </div>
          <div class="min-w-0">
            <div class="font-medium">{{ props.title }}</div>
            <div class="text-sm opacity-80 mt-1 leading-6">{{ props.desc }}</div>
            <div v-if="props.to" class="text-sm text-blue-600 dark:text-blue-400 mt-2">进入 &rsaquo;</div>
          </div>
        </div>
      </el-card>
    </div>
  `
}

const router = useRouter()

const goLogin = () => router.push('/login')
const goDashboard = () => router.push('/inner/dashboard')
const goMap = () => router.push('/inner/globalview')

// 首页 KPI（演示可直接替换为后端）
const kpis = [
  { label: '接入基地', value: '12', desc: '已对接生产/试点基地' },
  { label: '装置/设备', value: '86 / 2,741', desc: '在线监测中' },
  { label: '近7天诊断 / 高概率', value: '5,412 / 326', desc: '诊断次数 / ≥阈值' },
  { label: '平均 MTTR', value: '6.4h', desc: '近30天已完工单统计' }
]

// 对应你的 10 大功能点，文案面向故障诊断业务
const featureList = [
  { title: '状态甄别（单点）', desc: '按配置映射 2 个特征到坐标轴，实时判定 Normal/Warning/Fault 并标注置信度。', icon: 'i-ep-aim', to: '/inner/device' },
  { title: '故障诊断（多点）', desc: '结合特征与通道多点分析，输出散点图与诊断结果（概率、依据、原始文件溯源）。', icon: 'i-ep-data-line', to: '/inner/dashboard' },
  { title: '设备健康预测', desc: '多模型独立预测 RUL/HI/Confidence，并做趋势与稳定性校验（时间窗）。', icon: 'i-ep-trend-charts', to: '/inner/device' },
  { title: '趋势预测（特征）', desc: '特征未来值预测与历史对比，时间间隔自动对齐，支持导出图片/Excel。', icon: 'i-ep-timer', to: '/inner/dashboard' },
  { title: '特征质量检验', desc: 'ZScore/IQR 等方法逐项检验；不合格数据自动禁用参与诊断/预测。', icon: 'i-ep-check', to: '/inner/dashboard' },
  { title: '装置聚合', desc: '装置级聚合 RUL/HI/Confidence，支持均值/加权/中位配置，用于装置卡与地图。', icon: 'i-ep-collection', to: '/inner/globalview' },
  { title: '基地总览', desc: '基地内装置概况、设备健康/RUL 分布、诊断热点与高风险装置排行。', icon: 'i-ep-location', to: '/inner/globalview' },
  { title: '维修决策', desc: '输入周期与故障码，生成多策略方案（成本/时间/配件/效果），一键生成工单。', icon: 'i-ep-suitcase', to: '/inner/dashboard' },
  { title: '任务评估', desc: '按任务坐标评估装置可达性（距离 × 航速），输出可执行清单。', icon: 'i-ep-position', to: '/inner/dashboard' }
]
</script>

<style scoped>
/* 可选：Hero 背景轻微缩放动效 */
.home :deep(img[alt="hero"]) {
  animation: bgZoom 18s ease-in-out infinite alternate;
}

@keyframes bgZoom {
  from { transform: scale(1.0); }
  to   { transform: scale(1.06); }
}

/* Element Plus Steps 在暗色下的色彩微调（更柔和） */
:deep(.el-steps) { --el-color-primary: rgb(59 130 246); }
:deep(html.dark) .el-step__title, :deep(html.dark) .el-step__description { color: rgba(255,255,255,.85); }
</style>
