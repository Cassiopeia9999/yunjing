<!-- src/views/Dashboard.vue  ——  全屏·霓虹边框·流光标题 -->
<template>
  <div class="screen-wrap text-white">
    <!-- 背景网格/暗角 -->
    <div class="bg-grid pointer-events-none"></div>

    <!-- 顶栏：居中超亮标题 + 状态 -->
    <header class="relative z-10">
      <div class="px-4 pt-3 w-full">
        <div class="flex items-center justify-between">
          <div class="flex-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>

          <div class="title-wrap mx-3">
            <h1 class="title-glow">综合监测诊断平台 · 全局态势</h1>
            <div class="title-strip"></div>
          </div>

          <div class="flex-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>

          <span
              class="hidden md:inline-flex items-center gap-1 ml-3 rounded-full px-2 py-[2px] text-[11px] font-medium
                   bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/30"
          >
            <i class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></i> ONLINE
          </span>
        </div>
      </div>
    </header>

    <main class="relative z-10 w-full px-4 pb-8">
      <!-- KPI 霓虹卡片（全屏自适应） -->
      <section class="mt-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <article v-for="k in kpis" :key="k.key" class="kpi-card group">
          <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
          <div class="flow-border"></div>
          <div class="scan-x"></div>

          <div class="text-[12px] tracking-wide text-cyan-100/85">{{ k.label }}</div>
          <div class="mt-1 flex items-baseline gap-1">
            <div class="kpi-num">{{ k.value }}</div>
            <div v-if="k.unit" class="text-xs text-cyan-200/80">{{ k.unit }}</div>
          </div>
        </article>
      </section>

      <!-- 主体三栏（全屏） -->
      <section class="mt-4 grid grid-cols-12 gap-4">
        <!-- 左列 -->
        <div class="col-span-12 lg:col-span-3 space-y-4">
          <article class="panel">
            <div class="panel-head">
              <span>系统健康占比</span><i class="hud-dot"></i>
            </div>
            <div ref="pieEl" class="h-[240px]"></div>
          </article>

          <article class="panel">
            <div class="panel-head">
              <span>告警快讯</span><i class="hud-dot"></i>
            </div>
            <ul class="divide-y divide-cyan-400/10">
              <li v-for="(i,idx) in alarmFeed" :key="idx" class="py-2.5 flex items-start gap-3">
                <span class="w-14 shrink-0 text-[11px] text-cyan-200/90 mt-[2px]">{{ i.time }}</span>
                <span class="flex-1 leading-5">{{ i.title }}</span>
                <span class="lvl" :class="levelClass(i.level)">{{ i.level }}</span>
              </li>
            </ul>
          </article>
        </div>

        <!-- 中列：立体地图 -->
        <div class="col-span-12 lg:col-span-6">
          <article class="panel p-2">
            <ChinaNeonMap />
          </article>
        </div>

        <!-- 右列 -->
        <div class="col-span-12 lg:col-span-3 space-y-4">
          <article class="panel">
            <div class="panel-head">
              <span>高风险省份 TopN</span><i class="hud-dot"></i>
            </div>
            <div ref="barEl" class="h-[260px]"></div>
          </article>

          <article class="panel">
            <div class="panel-head">
              <span>近14天告警趋势</span><i class="hud-dot"></i>
            </div>
            <div ref="lineEl" class="h-[260px]"></div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import ChinaNeonMap from '@/components/bigscreen/ChinaNeonMap.vue'

import { getKpis, getTopProvinces, getAlarmTrend, getAlarmFeed, getHealthPie } from '@/mock/bigScreenMock'

const kpis        = ref(getKpis())
const topProv     = ref(getTopProvinces())
const alarmTrend  = ref(getAlarmTrend())
const alarmFeed   = ref(getAlarmFeed())
const healthPie   = ref(getHealthPie?.() ?? [
  { name: '正常', value: 66 }, { name: '关注', value: 22 }, { name: '故障', value: 12 }
])

const pieEl  = ref(null)
const barEl  = ref(null)
const lineEl = ref(null)
let pieChart, barChart, lineChart

const levelClass = (lv)=>({
  高:'text-rose-300 ring-rose-300/40', 中:'text-amber-300 ring-amber-300/40', 低:'text-teal-300 ring-teal-300/40'
}[lv] || 'text-cyan-300 ring-cyan-300/40')

const pieOpt = ()=>({
  tooltip:{ trigger:'item' },
  series:[{
    type:'pie', radius:['45%','70%'], center:['50%','52%'], startAngle:90,
    itemStyle:{ borderColor:'#05101a', borderWidth:2 },
    label:{ color:'#e7fdff', fontSize:12 },
    data: healthPie.value.map((d,i)=>({
      name:d.name, value:d.value,
      itemStyle:{ color:['#22d3ee','#60a5fa','#f87171'][i], shadowBlur:18, shadowColor:'rgba(34,211,238,.35)' }
    }))
  }]
})
const barOpt = ()=>({
  grid:{ left:8, right:10, top:6, bottom:8, containLabel:true },
  xAxis:{ type:'value', axisLine:{show:false}, axisTick:{show:false}, axisLabel:{color:'#bfeaff'}, splitLine:{show:false}},
  yAxis:{ type:'category', data: topProv.value.map(d=>d.name), axisLine:{show:false}, axisTick:{show:false}, axisLabel:{color:'#e6fbff'} },
  series:[{
    type:'bar', barWidth:12,
    data: topProv.value.map(d=>({ value:d.value, itemStyle:{
        color: new echarts.graphic.LinearGradient(1,0,0,0,[{offset:0,color:'#a7f3d0'},{offset:1,color:'#06b6d4'}]),
        shadowBlur:16, shadowColor:'rgba(6,182,212,.45)'
      }})),
    label:{ show:true, position:'right', color:'#d7faff', fontWeight:'600' }
  }]
})
const lineOpt = ()=>({
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

onMounted(initCharts)
onBeforeUnmount(()=>window.removeEventListener('resize', onResize))
</script>

<style scoped>
/* ===== 背景：更深的对比 + 网格 ===== */
.screen-wrap{
  @apply relative min-h-screen overflow-auto w-full;
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

/* ===== 标题：更亮 + 流光 ===== */
.title-wrap{ position:relative; text-align:center; }
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

/* ===== 霓虹 Panel：亮边框 + 流光装饰 ===== */
.panel{
  @apply relative rounded-xl p-3;
  background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
  box-shadow: inset 0 0 50px rgba(34,211,238,.06), 0 12px 32px rgba(0,0,0,.45);
}
.panel::before{ /* 发光外描边 */
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  border:1px solid rgba(34,211,238,.22);
  box-shadow: 0 0 18px rgba(34,211,238,.22) inset;
}
.panel::after{  /* 动态流光边线（沿边旋转） */
  content:""; position:absolute; inset:0; border-radius:inherit; padding:1px;
  background: conic-gradient(from var(--a,0deg), transparent 10%, rgba(56,189,248,.9) 18%, transparent 26%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: rotateBorder 6s linear infinite;
  opacity:.55;
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
.kpi-card{
  @apply relative overflow-hidden rounded-xl px-3 py-3;
  background: linear-gradient(180deg, rgba(2,6,23,.28), rgba(2,6,23,.46));
  box-shadow: inset 0 0 40px rgba(34,211,238,.10), 0 8px 24px rgba(0,0,0,.35);
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
