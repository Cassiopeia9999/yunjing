<template>
  <div class="neon-panel relative">
    <!-- 角标装饰 -->
    <div class="abs-corners pointer-events-none">
      <span class="c tl"></span><span class="c tr"></span>
      <span class="c bl"></span><span class="c br"></span>
    </div>

    <!-- 外层容器：autoFit 时由父容器控制高度；否则用传入的 height -->
    <div
        ref="containerEl"
        class="w-full relative"
        :class="autoFit ? 'h-full' : ''"
        :style="autoFit ? undefined : { height }"
    >
      <!-- ECharts 容器：始终占满外层容器 -->
      <div ref="chartEl" class="w-full h-full" />
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import china from '@/assets/maps/china-province.json'
import * as mock from '@/mock/bigScreenMock.js'

const props = defineProps({
  autoFit: { type: Boolean, default: true },
  height: { type: String, default: '66vh' },
})

const bases = ref([])
const provStat = ref([])
const centerHub = ref({ name: '中控中心', coord: [112.938814, 28.228209] })

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : [])

async function fallbackInit() {
  let top = []
  if (typeof mock.getTopProvinces === 'function') {
    try { top = asArray(await mock.getTopProvinces()) } catch {}
  }
  provStat.value = (top.length ? top : [
    { name: '广东', value: 266 }, { name: '浙江', value: 185 }, { name: '山东', value: 150 },
    { name: '上海', value: 118 }, { name: '北京', value: 132 }, { name: '四川', value: 102 },
  ]).map(d => ({ name: d.name, value: Number(d.value) || 0 }))

  bases.value = [
    { name: '北京基地', coord: [116.405285, 39.904989], value: 86 },
    { name: '上海基地', coord: [121.472644, 31.231706], value: 73 },
    { name: '广州基地', coord: [113.264385, 23.129112], value: 65 },
    { name: '成都基地', coord: [104.065735, 30.659462], value: 58 },
    { name: '西安基地', coord: [108.939621, 34.343147], value: 52 },
  ]
  centerHub.value = { name: '中控中心', coord: [112.938814, 28.228209] }
}

async function loadDataFromApi() {
  try {
    const m = await mock.getMapData()
    const top = m?.provStat?.length ? m.provStat : await mock.getTopProvinces()

    bases.value = asArray(m?.bases).map(b => ({
      ...b,
      coord: (b?.coord || []).map(Number),
      value: Number(b?.value) || 0,
    }))
    provStat.value = asArray(top).map(d => ({ name: d.name, value: Number(d.value) || 0 }))
    centerHub.value =
        m?.centerHub && Array.isArray(m.centerHub.coord)
            ? { name: m.centerHub.name || '中控中心', coord: m.centerHub.coord.map(Number) }
            : centerHub.value

    if (!bases.value.length || !provStat.value.length) await fallbackInit()
  } catch {
    await fallbackInit()
  }
}

const containerEl = ref(null)
const chartEl = ref(null)
let chart, ro, ringTimer = null, ringRadius = 0

function toLineData() {
  return bases.value.map(b => ({
    fromName: b.name,
    toName: centerHub.value.name,
    coords: [b.coord, centerHub.value.coord],
    value: b.value,
  }))
}

function buildOption() {
  const maxV = Math.max(0, ...provStat.value.map(d => d.value || 0))
  const areaGrad = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#77E3FF' },
    { offset: 0.45, color: '#3AA7FF' },
    { offset: 1, color: '#0C2B5A' },
  ])

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      borderColor: 'rgba(255,255,255,.35)',
      backgroundColor: 'rgba(10,25,40,.9)',
      textStyle: { color: '#E8FBFF' },
      formatter: (p) => {
        if (p.seriesType === 'map') return `${p.name}：${p.value ?? 0}`
        if (p.seriesType === 'effectScatter') return `${p.data.name}<br/>指数：${p.data.value[2]}`
        if (p.seriesType === 'lines') return `${p.data.fromName} → ${p.data.toName}`
        return p.name || ''
      },
    },
    geo: {
      map: 'china',
      roam: true,
      layoutCenter: ['50%', '62%'],
      layoutSize: '110%',
      // zoom: 1.18,
      itemStyle: {
        areaColor: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(90,227,255,.25)' },
          { offset: 0.6, color: 'rgba(58,167,255,.22)' },
          { offset: 1, color: 'rgba(4,22,48,.55)' },
        ]),
        borderColor: 'rgba(170,228,255,.85)',
        borderWidth: 1.2,
        shadowColor: 'rgba(0,200,255,.35)',
        shadowBlur: 30,
        shadowOffsetY: 10,
      },
      label: { show: false },
      emphasis: { itemStyle: { areaColor: 'rgba(120,220,255,.55)', borderColor: '#FFFFFF', borderWidth: 1.4 } },
    },
    visualMap: {
      type: 'continuous',
      min: 0,
      max: maxV || 500,
      right: 12,
      bottom: 18,
      text: ['高', '低'],
      inRange: { color: ['#80FFEA', '#49D3FF', '#3B82F6', '#F59E0B', '#F43F5E'] },
      textStyle: { color: '#E6FAFF' },
      itemWidth: 12,
      itemHeight: 140,
      calculable: true,
    },
    series: [
      { // 投影层
        type: 'map', map: 'china', geoIndex: 0, zlevel: 0,
        left: '0.4%', top: '1.2%', silent: true,
        itemStyle: {
          areaColor: '#0A1E3F',
          borderColor: 'rgba(0,255,255,.20)',
          borderWidth: 2,
          shadowColor: 'rgba(0,0,0,.55)',
          shadowBlur: 40,
          shadowOffsetY: 18,
        },
      },
      { // 主热度层
        name: '省份热度', type: 'map', map: 'china', geoIndex: 0, zlevel: 2,
        itemStyle: {
          areaColor: areaGrad,
          borderColor: '#BFF4FF',
          borderWidth: 1.6,
          shadowColor: 'rgba(0, 255, 255, .28)',
          shadowBlur: 22,
        },
        emphasis: { itemStyle: { areaColor: '#A9F3FF', borderColor: '#ffffff', borderWidth: 1.8 } },
        data: provStat.value,
      },
      { // 高光描边
        type: 'map', map: 'china', geoIndex: 0, zlevel: 3, silent: true,
        itemStyle: { areaColor: 'transparent', borderColor: 'rgba(255,255,255,.65)', borderWidth: 0.8 },
      },
      { // 基地点位
        name: '基地', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 5,
        rippleEffect: { brushType: 'stroke', scale: 4.2 },
        symbol: 'circle',
        symbolSize: (val) => 10 + (val[2] || 0) / 14,
        itemStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.35, color: '#8BFBFF' },
            { offset: 1, color: '#17E2FF' },
          ]),
          shadowBlur: 30,
          shadowColor: 'rgba(23,226,255,.75)',
        },
        label: { show: true, formatter: '{b}', position: 'right', color: '#EFFFFF', fontWeight: 700 },
        data: bases.value.map(b => ({ name: b.name, value: [...b.coord, b.value] })), // ← 无点击所需 raw
      },
      { // 扫描环
        name: '扫描', type: 'custom', coordinateSystem: 'geo', zlevel: 4,
        renderItem(params, api) {
          const coord = api.coord(centerHub.value.coord)
          const r = 10 + (ringRadius % 80)
          return {
            type: 'circle',
            shape: { cx: coord[0], cy: coord[1], r },
            style: { fill: 'transparent', stroke: 'rgba(13,241,32,0.85)', lineWidth: 2.2,
              shadowBlur: 12, shadowColor: 'rgba(120,255,255,.65)' },
            silent: true,
          }
        },
        data: [centerHub.value.coord],
      },
      { // 航线
        name: '联通', type: 'lines', zlevel: 6, coordinateSystem: 'geo',
        effect: { show: true, symbol: 'arrow', period: 3.2, trailLength: 0.25, symbolSize: 8, color: '#9AFBFF' },
        lineStyle: {
          width: 2,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: 'rgba(0,255,255, .05)' },
            { offset: 1, color: 'rgba(8,241,151,0.95)' },
          ]),
          curveness: 0.22,
          shadowColor: 'rgba(0,255,255,.45)',
          shadowBlur: 16,
        },
        data: toLineData(),
      },
      { // 中控中心
        name: '中控中心', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 7,
        rippleEffect: { brushType: 'fill', scale: 5.5 }, symbolSize: 16,
        itemStyle: { color: '#FFFFFF', shadowBlur: 36, shadowColor: 'rgba(120,255,255,.9)' },
        label: { show: true, formatter: '{b}', position: 'right', color: '#FFFFFF', fontWeight: 800 },
        data: [{ name: centerHub.value.name, value: [...centerHub.value.coord, 100] }],
      },
    ],
  }
}

function resizeChart() {
  if (!chart) return
  requestAnimationFrame(() => chart.resize())
}

async function initChart() {
  await loadDataFromApi()
  echarts.registerMap('china', china)
  chart = echarts.init(chartEl.value)
  chart.setOption(buildOption())

  // 不做任何点击事件绑定

  // 自适应
  window.addEventListener('resize', resizeChart)
  if (window.ResizeObserver) {
    ro = new ResizeObserver(() => resizeChart())
    if (containerEl.value) ro.observe(containerEl.value)
    if (containerEl.value?.parentElement) ro.observe(containerEl.value.parentElement)
  }

  // 扫描环动画（仅刷新 custom series）
  ringTimer = setInterval(() => {
    ringRadius = ringRadius + 1.6 > 80 ? 12 : ringRadius + 1.6
    chart.setOption({ series: [{}, {}, {}, {}, {}, {}, {}] }, false)
  }, 40)
}

onMounted(initChart)
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  if (ro) { ro.disconnect(); ro = null }
  if (ringTimer) clearInterval(ringTimer)
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style scoped>
.neon-panel{
  box-shadow:
      inset 0 0 60px rgba(120,255,255,.12),
      0 12px 32px rgba(0,0,0,.45),
      0 0 24px rgba(120,255,255,.18);
  border-color: rgba(120,255,255,.35);
}
.abs-corners .c{
  position:absolute; width:20px; height:20px; border:2px solid rgba(56,189,248,.45);
  filter: drop-shadow(0 0 6px rgba(34,211,238,.35)); border-radius:4px;
}
.abs-corners .tl{ top:6px; left:8px; border-right:none; border-bottom:none; }
.abs-corners .tr{ top:6px; right:8px; border-left:none; border-bottom:none; }
.abs-corners .bl{ bottom:6px; left:8px; border-right:none; border-top:none; }
.abs-corners .br{ bottom:6px; right:8px; border-left:none; border-top:none; }
</style>
