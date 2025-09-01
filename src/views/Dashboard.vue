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

import { getKpis, getTopProvinces, getAlarmTrend, getAlarmFeed, getHealthPie } from '@/mock/bigScreenMock'
import { getBaseList } from '@/mock/fetchDataApi.js'

const router = useRouter()

/* ---------- 数据 ---------- */
const kpis        = ref([])
const topProv     = ref([])
const alarmTrend  = ref(getAlarmTrend())   // 先用占位即可
const alarmFeed   = ref(getAlarmFeed())    // 先用占位即可
const healthPie   = ref(getHealthPie?.() ?? [{ name:'正常', value:66 }, { name:'关注', value:22 }, { name:'故障', value:12 }])

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
const barEl  = ref(null)
const lineEl = ref(null)
let pieChart, barChart, lineChart

const levelClass = (lv)=>({
  高:'text-rose-300 ring-rose-300/40', 中:'text-amber-300 ring-amber-300/40', 低:'text-teal-300 ring-teal-300/40'
}[lv] || 'text-cyan-300 ring-cyan-300/40')

const pieOpt = () => ({
  tooltip:{ trigger:'item' },
  series:[{
    type:'pie', radius:['45%','70%'], center:['50%','52%'], startAngle:90,
    itemStyle:{ borderColor:'#05101a', borderWidth:2 },
    label:{ color:'#e7fdff', fontSize:12 },
    data: (healthPie.value || []).map((d,i)=>({
      name:d.name, value:d.value,
      itemStyle:{ color:['#22d3ee','#60a5fa','#f87171'][i%3],
        shadowBlur:18, shadowColor:'rgba(34,211,238,.35)' }
    }))
  }]
})

const barOpt = () => ({
  grid:{ left:8, right:10, top:6, bottom:8, containLabel:true },
  xAxis:{ type:'value', axisLine:{show:false}, axisTick:{show:false}, axisLabel:{color:'#bfeaff'}, splitLine:{show:false}},
  yAxis:{ type:'category', data: (topProv.value || []).map(d=>d.name),
    axisLine:{show:false}, axisTick:{show:false}, axisLabel:{color:'#e6fbff'} },
  series:[{
    type:'bar', barWidth:12,
    data: (topProv.value || []).map(d=>({ value:d.value, itemStyle:{
        color: new echarts.graphic.LinearGradient(1,0,0,0,[
          {offset:0,color:'#a7f3d0'},{offset:1,color:'#06b6d4'}]),
        shadowBlur:16, shadowColor:'rgba(6,182,212,.45)'
      }})),
    label:{ show:true, position:'right', color:'#d7faff', fontWeight:'600' }
  }]
})

const lineOpt = () => ({
  grid:{ left:32, right:12, top:12, bottom:20 },
  xAxis:{ type:'category', data: alarmTrend.value.x, axisTick:{show:false}, axisLabel:{color:'#c8f2ff'},
    axisLine:{ lineStyle:{ color:'rgba(94,234,212,.28)'} } },
  yAxis:{ type:'value', axisLine:{show:false}, axisLabel:{color:'#c8f2ff'}, splitLine:{ lineStyle:{ color:'rgba(94,234,212,.12)'} } },
  series:[{
    type:'line', smooth:true, data: alarmTrend.value.y, showSymbol:false,
    lineStyle:{ width:3, color:'#67e8f9', shadowBlur:14, shadowColor:'rgba(103,232,249,.6)' },
    areaStyle:{ color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(103,232,249,.32)'},{offset:1,color:'rgba(13,148,136,0)'}]) }
  }]
})

function initCharts(){
  pieChart  = echarts.init(pieEl.value)
  barChart  = echarts.init(barEl.value)
  lineChart = echarts.init(lineEl.value)
  pieChart.setOption(pieOpt())
  barChart.setOption(barOpt())
  lineChart.setOption(lineOpt())
  window.addEventListener('resize', onResize)
}
function onResize(){ pieChart?.resize(); barChart?.resize(); lineChart?.resize() }

/* ---------- 跳转 ---------- */
function goBase(b){
  if (!b?.id) return
  router.push({ name:'ManageBaseView', params:{ baseId: String(b.id) } })
}

/* ---------- 加载 ---------- */
onMounted(async () => {
  // KPI / TopN 异步来源
  try { kpis.value    = await getKpis() } catch(e){ kpis.value = [] }
  try { topProv.value = await getTopProvinces() } catch(e){ topProv.value = [] }

  // 基地列表（直接走后端）
  try { baseList.value = (await getBaseList()) || [] } catch(e){ baseList.value = [] }

  initCharts()
  // 数据到位后刷新 bar
  barChart?.setOption(barOpt(), true)
})
onBeforeUnmount(()=>window.removeEventListener('resize', onResize))
</script>

<style scoped>
/* ===== 背景：深对比 + 网格 ===== */
.screen-wrap{
  @apply relative min-h-screen w-full;
  background:
      radial-gradient(1200px 500px at 50% -220px, rgba(34,211,238,.16), transparent 60%),
      linear-gradient(180deg, #06131e 0%, #071a2a 55%, #081521 100%);
}
.bg-grid{
  position: fixed; inset: 0; z-index: 0; opacity: .20;
  background-image:
      repeating-linear-gradient(0deg, rgba(148,163,184,.10) 0 1px, transparent 1px 42px),
      repeating-linear-gradient(90deg, rgba(148,163,184,.10) 0 1px, transparent 1px 42px);
}

.bg-grid{
  position: fixed; inset: 0; z-index: 0; opacity: .22;
  background-image:
      repeating-linear-gradient(0deg, rgba(148,163,184,.12) 0 1px, transparent 1px 40px),
      repeating-linear-gradient(90deg, rgba(148,163,184,.12) 0 1px, transparent 1px 40px);
  filter: drop-shadow(0 0 22px rgba(56,189,248,.18));
}

/* ===== 英雄标题：大字号 + 霓虹翼 + 双线下划光 ===== */
.hero-title{ position:relative; text-align:center; padding: 6px 18px 12px; }
.title-glow-neo{
  font-weight: 900;
  font-size: clamp(28px, 3.6vw, 48px);
  letter-spacing: .35em;
  text-transform: uppercase;

  /* 提升本体亮度：更偏白的渐变 */
  background: linear-gradient(
      90deg,
      #ffffff,
      #f2feff,
      #cfffff,
      #9cf5ff,
      #5fe6ff,
      #ffffff
  );
  background-size: 260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;

  /* 收敛光影：缩小半径、降低强度，边缘更干净 */
  text-shadow:
      0 0 6px rgba(210, 249, 255, .85),
      0 0 14px rgba(56, 189, 248, .38);

  /* 细描边让字更“挺”一些（可选，若不需要可删） */
  -webkit-text-stroke: 0.5px rgba(255,255,255,.25);

  animation: titleShine 7s linear infinite;
}

@keyframes titleShine{ 0%{background-position:0%} 100%{background-position:300%} }

/* 侧翼装饰 */
.hero-title .wing{
  position:absolute; top:50%; width:210px; height:18px; transform:translateY(-50%);
  background: radial-gradient(closest-side, rgba(94,234,212,.85), transparent 70%);
  filter: blur(1px) drop-shadow(0 0 10px rgba(34,211,238,.55));
  opacity:.85; pointer-events:none;
}
.hero-title .wing.left{ left:-16px; clip-path: polygon(0 50%,100% 0,100% 100%); }
.hero-title .wing.right{ right:-16px; clip-path: polygon(0 0,100% 50%,0 100%); }

/* 双层下划线 */
.title-underline{ position:relative; height:10px; margin-top:6px; }
.title-underline .bar{
  position:absolute; left:50%; transform:translateX(-50%);
  width:68%; height:2px; border-radius:9999px;
  background: linear-gradient(90deg, transparent, #67e8f9, transparent);
  box-shadow: 0 0 16px #22d3ee;
}
.title-underline .bar.glow{
  top:4px; width:42%; height:6px; filter: blur(4px); opacity:.65;
  background: radial-gradient(closest-side,#67e8f9, transparent 65%);
}
/* ===== 标题：更亮 + 流光 ===== */
.title-wrap{ position:relative; text-align:center; z-index: 2; }
.title-glow{
  @apply text-[20px] md:text-[26px] font-extrabold tracking-[.55em] uppercase;
  background: linear-gradient(90deg,#e0f2fe,#a7f3d0,#67e8f9,#22d3ee,#e0f2fe);
  background-size: 300% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 12px rgba(125,211,252,.95), 0 0 36px rgba(34,211,238,.55);
  animation: titleShine 8s linear infinite;
}
.title-strip{
  position:absolute; left:50%; transform:translateX(-50%); bottom:-8px; width:66%;
  height:2px; background: radial-gradient(closest-side,#67e8f9,transparent);
  filter: drop-shadow(0 0 10px #22d3ee);
}
@keyframes titleShine{ 0%{background-position:0%} 100%{background-position:300%} }

/* 内容区容器：提供定位上下文给背景地图 */
.content-area{
  position: relative;
  min-height: 60vh;   /* 自行调大/调小，让地图区域更高或更矮 */
  z-index: 1;         /* 低于上层卡片的 z-10 */
}

/* 地图背景：只覆盖“内容区”，不影响标题和 KPI 带 */
.content-map-bg{
  position: absolute;
  inset: 0;           /* 填满 content-area */
  z-index: 0;
  opacity: .95;
  filter: drop-shadow(0 0 30px rgba(34,211,238,.15));
  /* 不拦截鼠标事件，保证面板里的输入/滚动等可用 */
  pointer-events: none;
}

/* ===== 霓虹 Panel：亮边框 + 流光装饰 ===== */
.panel{
  @apply relative rounded-xl p-3;
  background: linear-gradient(180deg, rgba(10,20,32,.45), rgba(10,20,32,.32)); /* 比原先更通透 */
  box-shadow: inset 0 0 50px rgba(34,211,238,.10), 0 12px 32px rgba(0,0,0,.45);
}
.panel::before{
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  border:1px solid rgba(34,211,238,.22);
  box-shadow: 0 0 18px rgba(34,211,238,.22) inset;
}
/* 你已有的面板样式，补充 pointer-events:none */
.panel::after{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  padding:1px;
  background: conic-gradient(from var(--a,0deg), transparent 10%, rgba(56,189,248,.9) 18%, transparent 26%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: rotateBorder 6s linear infinite;
  opacity:.55;

  /* 🔧 关键：不要拦截鼠标/键盘事件 */
  pointer-events: none;
}

@keyframes rotateBorder{ to{ --a: 360deg; } }

.panel-head{
  @apply mb-2 flex items-center justify-between text-cyan-100;
  letter-spacing:.06em; font-weight:700;
}
.hud-dot{ width:8px; height:8px; border-radius:9999px;
  background: radial-gradient(#67e8f9,#22d3ee); filter: drop-shadow(0 0 8px #22d3ee); }
.lvl{ @apply text-[11px] rounded px-1.5 ring-1; }

/* ===== KPI 卡片：角标 + 流光边框 + 扫描线 ===== */
.kpi-card {
  @apply relative overflow-hidden rounded-xl px-3 py-4;
  background: linear-gradient(180deg, rgba(2,6,23,.38), rgba(2,6,23,.6));
  box-shadow: inset 0 0 40px rgba(34,211,238,.18), 0 8px 24px rgba(0,0,0,.4);
  color: #eaffff; /* 让字体更亮 */
  text-align: center;
}

.kpi-num {
  @apply text-[28px] md:text-[34px] font-black tracking-wide;
  text-shadow: 0 0 12px rgba(34,211,238,.8), 0 0 28px rgba(34,211,238,.5);
}
.kpi-card .flow-border{
  position:absolute; inset:0; border-radius:inherit; pointer-events:none; padding:1px;
  background: linear-gradient(90deg, rgba(34,211,238,.0), rgba(34,211,238,.8), rgba(34,211,238,0));
  background-size: 200% 1px; background-repeat:no-repeat; background-position: -200% 0, 0 100%;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: flowRing 2.8s linear infinite;
}
@keyframes flowRing{ to{ background-position: 0 0, 200% 100%; } }
.kpi-card .scan-x{
  position:absolute; left:-40%; right:-40%; top:0; height:2px; opacity:.9;
  background: linear-gradient(90deg, transparent, #67e8f9, transparent);
  filter: drop-shadow(0 0 6px #22d3ee);
  animation: scanX 2.2s linear infinite;
}
@keyframes scanX{ 0%{transform:translateX(-40%)} 100%{transform:translateX(40%)} }
.corner{ position:absolute; width:18px; height:18px; border:2px solid rgba(125,211,252,.7); border-radius:4px;
  filter: drop-shadow(0 0 6px rgba(34,211,238,.45)); }
.tl{ top:6px; left:8px; border-right:none; border-bottom:none }
.tr{ top:6px; right:8px; border-left:none; border-bottom:none }
.bl{ bottom:6px; left:8px; border-right:none; border-top:none }
.br{ bottom:6px; right:8px; border-left:none; border-top:none }
.kpi-num{
  @apply text-[26px] md:text-[32px] font-black tracking-wide;
  text-shadow: 0 0 10px rgba(34,211,238,.7), 0 0 26px rgba(34,211,238,.4);
  animation: numPulse 3s ease-in-out infinite;
}
@keyframes numPulse{ 0%,100%{ filter:brightness(1)} 50%{ filter:brightness(1.22)} }
</style>
