<template>
  <div class="screen-wrap text-white relative overflow-hidden">
    <!-- 背景网格/暗角（仍然是全屏的淡网格） -->
    <div class="bg-grid pointer-events-none"></div>

    <!-- 顶栏 -->
    <header class="relative z-20">
      <div class="px-4 pt-3 w-full">
        <div class="flex items-center justify-between">
          <div class="flex-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"></div>

          <!-- ⬇️ 新标题：更大、更亮、带装饰 -->
          <div class="hero-title mx-3">
            <div class="wing left"></div>
            <h1 class="title-glow-neo">综合监测诊断平台 · 全局态势</h1>
            <div class="wing right"></div>
            <div class="title-underline">
              <span class="bar"></span>
              <span class="bar glow"></span>
            </div>
          </div>

          <div class="flex-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"></div>

          <span
              class="hidden md:inline-flex items-center gap-1 ml-3 rounded-full px-2 py-[2px] text-[12px] font-semibold
               bg-emerald-400/30 text-emerald-100 ring-1 ring-emerald-200/60 shadow-[0_0_16px_rgba(16,185,129,.45)]">
        <i class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></i> ONLINE
      </span>
        </div>
      </div>
    </header>

    <main class="relative z-20 w-full px-4 pb-8">
      <!-- KPI 霓虹卡片（保持原位，地图不会盖住这一条） -->
      <section class="mt-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <article v-for="k in kpis" :key="k.key" class="kpi-card group">
          <i class="corner tl"></i><i class="corner tr"></i>
          <i class="corner bl"></i><i class="corner br"></i>
          <div class="flow-border"></div>
          <div class="scan-x"></div>

          <!-- 内容整体居中 -->
          <div class="flex flex-col items-center justify-center h-full text-center">
            <!-- 标签：字体加大、加亮 -->
            <div class="text-[14px] md:text-[16px] font-semibold text-cyan-50 drop-shadow-sm">
              {{ k.label }}
            </div>

            <!-- 数值部分：更亮，居中 -->
            <div class="mt-2 flex items-baseline justify-center gap-1">
              <div class="kpi-num text-cyan-100">{{ k.value ?? '—' }}</div>
              <div v-if="k.unit" class="text-sm text-cyan-200/90">{{ k.unit }}</div>
            </div>
          </div>
        </article>
      </section>

      <section class="content-area relative mt-4">
        <!-- 地图：作为内容区背景 -->
        <ChinaNeonMap class="content-map-bg pointer-events-none" :autoFit="true" />

        <!-- 两侧面板：分别靠左、靠右 -->
        <div class="relative z-10 flex flex-col lg:flex-row justify-between gap-4">
          <!-- 左列 -->
          <div class="w-full lg:w-[30%] space-y-4">
            <article class="panel">
              <div class="panel-head"><span>系统健康占比</span><i class="hud-dot"></i></div>
              <div ref="pieEl" class="h-[240px]"></div>
            </article>

            <article class="panel">
              <div class="panel-head"><span>告警快讯</span><i class="hud-dot"></i></div>
              <ul class="divide-y divide-cyan-400/10">
                <li v-for="(i,idx) in alarmFeed" :key="idx" class="py-2.5 flex items-start gap-3">
                  <span class="w-14 shrink-0 text-[11px] text-cyan-200/90 mt-[2px]">{{ i.time }}</span>
                  <span class="flex-1 leading-5">{{ i.title }}</span>
                  <span class="lvl" :class="levelClass(i.level)">{{ i.level }}</span>
                </li>
              </ul>
            </article>
          </div>

          <!-- 右列 -->
          <div class="w-full lg:w-[30%] space-y-4">
            <article class="panel">
              <div class="panel-head"><span>基地列表</span><i class="hud-dot"></i></div>
              <el-input v-model="baseKw" size="small" placeholder="搜索基地名称/地址" clearable class="mb-2"/>
              <el-scrollbar height="260px">
                <ul class="divide-y divide-cyan-400/10">
                  <li v-for="b in baseFiltered" :key="b.id"
                      class="py-2 px-1 hover:bg-cyan-400/10 rounded cursor-pointer flex items-center justify-between"
                      @click="goBase(b)">
                    <div class="min-w-0">
                      <div class="font-semibold truncate">{{ b.name }}</div>
                      <div class="text-[12px] opacity-80 truncate">{{ b.address || '—' }}</div>
                    </div>
                    <div class="text-right shrink-0 ml-2">
                      <div class="text-cyan-200 text-xs">评估 {{ b.eva_value ?? 0 }}</div>
                      <el-tag size="small" effect="plain">{{ b.status || '—' }}</el-tag>
                    </div>
                  </li>
                </ul>
              </el-scrollbar>
            </article>

            <article class="panel">
              <div class="panel-head"><span>近14天告警趋势</span><i class="hud-dot"></i></div>
              <div ref="lineEl" class="h-[260px]"></div>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import ChinaNeonMap from '@/components/bigscreen/ChinaNeonMap.vue'

// 仍保留 KPI 与后端联动；其它模拟在 mock 里
import { getKpis, getAlarmTrend, getAlarmFeed, getHealthPie } from '@/mock/bigScreenMock'
import { getBaseList } from '@/mock/fetchDataApi.js'

const router = useRouter()

/* ---------- 数据 ---------- */
const kpis        = ref([])
const alarmTrend  = ref(getAlarmTrend())
const alarmFeed   = ref(getAlarmFeed())
const healthPie   = ref(getHealthPie?.() ?? [
  { name:'正常', value:66 }, { name:'关注', value:22 }, { name:'故障', value:12 }
])

const baseList    = ref([])
const baseKw      = ref('')

const baseFiltered = computed(() => {
  const kw = baseKw.value.trim().toLowerCase()
  if (!kw) return baseList.value
  return baseList.value.filter(b =>
      (b.name||'').toLowerCase().includes(kw) ||
      (b.address||'').toLowerCase().includes(kw)
  )
})

/* ---------- 图表 ---------- */
const pieEl  = ref(null)
const lineEl = ref(null)
let pieChart, lineChart

const levelClass = (lv)=>({
  高:'text-rose-300 ring-rose-300/40',
  中:'text-amber-300 ring-amber-300/40',
  低:'text-teal-300 ring-teal-300/40'
}[lv] || 'text-cyan-300 ring-cyan-300/40')

// 深蓝主题主色（可按需微调）
const THEME = {
  cyan:   '#4fd1ff',
  blue:   '#2bb0ff',
  deep:   '#0a1c33',
  orange: '#ff9f43',
  pink:   '#ff6b81',
  grid:   'rgba(120,200,255,.12)',
  split:  'rgba(120,200,255,.16)',
  text:   '#e8f6ff'
}

const pieOpt = () => ({
  tooltip:{ trigger:'item' },
  series:[{
    type:'pie',
    radius:['46%','72%'], center:['50%','54%'], startAngle:90,
    itemStyle:{ borderColor:THEME.deep, borderWidth:2 },
    label:{ color:THEME.text, fontSize:13 },
    data: (healthPie.value || []).map((d,i)=>({
      name:d.name, value:d.value,
      itemStyle:{
        // 正常-蓝青；关注-橙；故障-粉红
        color:[THEME.cyan, THEME.orange, THEME.pink][i%3],
        shadowBlur:18, shadowColor:'rgba(79,209,255,.35)'
      }
    }))
  }]
})

const lineOpt = () => ({
  grid:{ left:36, right:14, top:18, bottom:24 },
  xAxis:{
    type:'category', data: alarmTrend.value.x,
    axisTick:{show:false},
    axisLabel:{color:THEME.text, fontSize:12},
    axisLine:{ lineStyle:{ color: THEME.grid } }
  },
  yAxis:{
    type:'value', axisLine:{show:false},
    axisLabel:{color:THEME.text, fontSize:12},
    splitLine:{ lineStyle:{ color: THEME.split } }
  },
  series:[{
    type:'line', smooth:true, data: alarmTrend.value.y, showSymbol:false,
    lineStyle:{ width:3, color: THEME.orange, shadowBlur:14, shadowColor:'rgba(255,159,67,.45)' },
    areaStyle:{ color:new echarts.graphic.LinearGradient(0,0,0,1,[
        {offset:0, color:'rgba(255,159,67,.32)'},
        {offset:1, color:'rgba(255,159,67,0)'}
      ]) }
  }]
})


function initCharts(){
  if (pieEl.value) {
    pieChart = echarts.init(pieEl.value)
    pieChart.setOption(pieOpt())
  }
  if (lineEl.value) {
    lineChart = echarts.init(lineEl.value)
    lineChart.setOption(lineOpt())
  }
  window.addEventListener('resize', onResize)
}
function onResize(){ pieChart?.resize(); lineChart?.resize() }

/* ---------- 跳转 ---------- */
function goBase(b){
  if (!b?.id) return
  router.push({ name:'ManageBaseView', params:{ baseId: String(b.id) } })
}

/* ---------- 加载 ---------- */
onMounted(async () => {
  // KPI（后端）
  try { kpis.value = await getKpis() } catch { kpis.value = [] }

  // 基地列表（后端）
  try { baseList.value = (await getBaseList()) || [] } catch { baseList.value = [] }

  initCharts()
})
onBeforeUnmount(()=>window.removeEventListener('resize', onResize))
</script>

<style scoped>
:root{
  --bg-top:  #071427;
  --bg-mid:  #081d36;
  --bg-bot:  #0a1f3d;
  --grid:    rgba(120,200,255,.12);
  --glow:    rgba(0,170,255,.35);
  --panel:   rgba(7,21,40,.60);
  --panel-2: rgba(7,21,40,.42);
  --stroke:  rgba(80,180,255,.30);
  --white:   #e8f6ff;
  --cyan:    #4fd1ff;
  --blue:    #2bb0ff;
  --orange:  #ff9f43;
  --pink:    #ff6b81;
}


/* ===== 背景整体：深蓝色风格 ===== */
.screen-wrap {
  @apply relative min-h-screen w-full;
  background: linear-gradient(180deg, #041229 0%, #061b35 50%, #020b1f 100%);
  color: #eaf7ff;
}
.bg-grid {
  position: fixed; inset: 0; z-index: 0; opacity: .16;
  background-image:
      repeating-linear-gradient(0deg, rgba(0,246,255,.08) 0 1px, transparent 1px 40px),
      repeating-linear-gradient(90deg, rgba(0,246,255,.08) 0 1px, transparent 1px 40px);
  filter: drop-shadow(0 0 24px rgba(0,246,255,.2));
}

/* ===== 标题：高亮蓝色发光 ===== */
.title-glow-neo {
  font-weight: 900;
  font-size: clamp(32px, 4vw, 56px);
  letter-spacing: .35em;
  text-transform: uppercase;
  background: linear-gradient(90deg, #aefcff, #ffffff, #5ad9ff, #1ec8ff, #aefcff);
  background-size: 280% 100%;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow:
      0 0 8px rgba(30,200,255,.9),
      0 0 20px rgba(244, 248, 248, 0.6);
  animation: titleShine 2s linear infinite;
}

/* ===== Panel 面板：更亮的蓝色描边 ===== */
.panel {
  @apply relative rounded-xl p-3;
  background: linear-gradient(180deg, rgba(4,18,41,.6), rgba(4,18,41,.4));
  box-shadow: inset 0 0 40px rgba(30,200,255,.18), 0 12px 28px rgba(0,0,0,.5);
}
.panel::before {
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  border:1.5px solid rgba(30,200,255,.85);
  box-shadow: 0 0 20px rgba(30,200,255,.5), inset 0 0 16px rgba(30,200,255,.35);
}

/* ===== KPI 卡片：亮蓝描边 + 数字更大 ===== */
.kpi-card {
  @apply relative overflow-hidden rounded-xl px-3 py-5;
  background: linear-gradient(180deg, rgba(2,10,25,.55), rgba(2,10,25,.75));
  box-shadow: inset 0 0 36px rgba(0,246,255,.2), 0 8px 20px rgba(0,0,0,.5);
  text-align: center;
}
.kpi-num {
  @apply text-[32px] md:text-[40px] font-black tracking-wide;
  text-shadow: 0 0 12px rgba(0,246,255,.9), 0 0 32px rgba(0,246,255,.6);
  color: #eaf7ff;
  animation: numPulse 3s ease-in-out infinite;
}

/* ===== 图表：改用橙色线条点缀 ===== */
.echarts-line .series-line {
  color: #ffae3a;
}


/* ===== 顶部标题：干净锐利，无发光 ===== */
.title-glow-neo {
  font-weight: 900;
  font-size: clamp(40px, 5vw, 72px);
  letter-spacing: .28em;
  line-height: 1.08;
  text-transform: uppercase;

  /* 白色到淡蓝渐变填充 */
  background: linear-gradient(90deg, #ffffff 0%, #dff7ff 40%, #9edaff 70%, #ffffff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* 清晰蓝色描边（非光效） */
  -webkit-text-stroke: 1px #4fc3ff;

  /* 去掉所有发光/阴影，保持干净 */
  text-shadow: none;
  filter: none;
}

/* 两侧装饰翼光（低调，避免喧宾夺主） */
.hero-title .wing {
  position: absolute;
  top: 50%;
  width: 180px;
  height: 10px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, rgba(79,195,255,.7), transparent);
  opacity: .6;
  pointer-events: none;
}
.hero-title .wing.left  { left: -14px; clip-path: polygon(0 50%,100% 0,100% 100%); }
.hero-title .wing.right { right:-14px; clip-path: polygon(0 0,100% 50%,0 100%); }

/* 下划线：细蓝线，保持锐利 */
.title-underline {
  position: relative;
  height: 8px;
  margin-top: 6px;
}
.title-underline .bar {
  position: absolute;
  left: 50%; transform: translateX(-50%);
  width: 65%; height: 2px; border-radius: 9999px;
  background: linear-gradient(90deg, transparent, #4fc3ff, transparent);
}
.title-underline .bar.glow { display: none; }




/* ===== 内容区容器与地图阴影 ===== */
.content-area{ position: relative; min-height: 60vh; z-index: 1; }
.content-map-bg{
  position: absolute; inset: 0; z-index: 0; opacity: .96;
  filter: drop-shadow(0 0 36px rgba(0,170,255,.18));
  pointer-events: none;
}

/* ===== 霓虹 Panel：深蓝玻璃 + 青色描边 ===== */
.panel{
  @apply relative rounded-xl p-3;
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  box-shadow: inset 0 0 60px rgba(0,170,255,.10), 0 16px 40px rgba(0,0,0,.45);
}
.panel::before{
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  border:1px solid var(--stroke);
  box-shadow: 0 0 18px rgba(0,170,255,.22) inset, 0 0 14px rgba(0,170,255,.18);
}
.panel::after{
  content:""; position:absolute; inset:0; border-radius:inherit; padding:1px;
  background: conic-gradient(from var(--a,0deg), transparent 10%, rgba(0,170,255,.85) 18%, transparent 26%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: rotateBorder 7s linear infinite; opacity:.5; pointer-events: none;
}
@keyframes rotateBorder{ to{ --a: 360deg; } }
.panel-head{
  @apply mb-2 flex items-center justify-between;
  color: var(--white);
  letter-spacing:.06em; font-weight:800; font-size: 16px; /* ⬆️ */
}
.hud-dot{ width:8px; height:8px; border-radius:9999px;
  background: radial-gradient(var(--cyan), var(--blue)); filter: drop-shadow(0 0 8px var(--blue)); }

/* ===== KPI 卡片 ===== */
.kpi-card {
  @apply relative overflow-hidden rounded-xl px-3 py-5;
  background: linear-gradient(180deg, rgba(5,13,28,.55), rgba(7,17,33,.72));
  box-shadow: inset 0 0 44px rgba(0,170,255,.18), 0 10px 28px rgba(0,0,0,.42);
  color: var(--white); text-align: center;
}
.kpi-num{
  /* ⬆️ 整体加大 */
  @apply text-[30px] md:text-[38px] font-black tracking-wide;
  text-shadow: 0 0 12px rgba(0,170,255,.8), 0 0 30px rgba(0,170,255,.45);
  animation: numPulse 3s ease-in-out infinite;
}
@keyframes numPulse{ 0%,100%{ filter:brightness(1)} 50%{ filter:brightness(1.18)} }
.kpi-card .flow-border{
  position:absolute; inset:0; border-radius:inherit; pointer-events:none; padding:1px;
  background: linear-gradient(90deg, rgba(0,170,255,0), rgba(0,170,255,.85), rgba(0,170,255,0));
  background-size: 200% 1px; background-repeat:no-repeat;
  background-position: -200% 0, 0 100%;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: flowRing 2.8s linear infinite;
}
@keyframes flowRing{ to{ background-position: 0 0, 200% 100%; } }
.kpi-card .scan-x{
  position:absolute; left:-40%; right:-40%; top:0; height:2px; opacity:.9;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  filter: drop-shadow(0 0 6px var(--cyan));
  animation: scanX 2.2s linear infinite;
}
@keyframes scanX{ 0%{transform:translateX(-40%)} 100%{transform:translateX(40%)} }
.corner{ position:absolute; width:18px; height:18px; border:2px solid rgba(120,200,255,.65); border-radius:4px;
  filter: drop-shadow(0 0 6px rgba(0,170,255,.45)); }
.tl{ top:6px; left:8px; border-right:none; border-bottom:none }
.tr{ top:6px; right:8px; border-left:none; border-bottom:none }
.bl{ bottom:6px; left:8px; border-right:none; border-top:none }
.br{ bottom:6px; right:8px; border-left:none; border-top:none }

/* 告警等级徽标：跟随新配色 */
.lvl{ @apply text-[11px] rounded px-1.5 ring-1; }
.lvl.text-rose-300{ color:var(--pink);    box-shadow:0 0 0 1px rgba(255,107,129,.4) inset; }
.lvl.text-amber-300{ color:var(--orange); box-shadow:0 0 0 1px rgba(255,159,67,.4) inset; }
.lvl.text-teal-300{  color:var(--cyan);   box-shadow:0 0 0 1px rgba(79,209,255,.4) inset; }

/* 通用 */
.title-wrap{ position:relative; text-align:center; z-index:2; }
</style>
