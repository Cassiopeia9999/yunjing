<template>
  <div class="neon-panel relative">
    <!-- 角标装饰 -->
    <div class="abs-corners pointer-events-none">
      <span class="c tl"></span><span class="c tr"></span>
      <span class="c bl"></span><span class="c br"></span>
    </div>
    <div ref="chartEl" class="w-full h-[66vh] min-h-[520px]" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import china from '@/assets/maps/china-province.json'
import * as mock from '@/mock/bigScreenMock.js'   // ✅ 所有数据来自 mock

const bases     = ref([])
const provStat  = ref([])
const centerHub = ref({ name: '中控中心', coord: [112.938814, 28.228209] })

function fallbackInit() {
  if (typeof mock.getTopProvinces === 'function') {
    provStat.value = mock.getTopProvinces().map(d => ({ name: d.name, value: d.value }))
  } else {
    provStat.value = []
  }
  bases.value = [
    { name: '北京基地',  coord: [116.405285, 39.904989], value: 86 },
    { name: '上海基地',  coord: [121.472644, 31.231706], value: 73 },
    { name: '广州基地',  coord: [113.264385, 23.129112], value: 65 },
    { name: '成都基地',  coord: [104.065735, 30.659462], value: 58 },
    { name: '西安基地',  coord: [108.939621, 34.343147], value: 52 },
  ]
  centerHub.value = { name: '中控中心', coord: [112.938814, 28.228209] }
}

function loadMockData() {
  if (typeof mock.getMapData === 'function') {
    const m = mock.getMapData()
    bases.value     = m?.bases || []
    provStat.value  = m?.provStat || []
    centerHub.value = m?.centerHub || centerHub.value
    if (!provStat.value?.length && typeof mock.getTopProvinces === 'function') {
      provStat.value = mock.getTopProvinces().map(d => ({ name: d.name, value: d.value }))
    }
    if (!bases.value?.length) fallbackInit()
  } else {
    fallbackInit()
  }
}

const chartEl = ref(null)
let chart
let ringTimer = null
let ringRadius = 0

function toLineData() {
  return bases.value.map(b => ({
    fromName: b.name,
    toName: centerHub.value.name,
    coords: [b.coord, centerHub.value.coord],
    value: b.value
  }))
}

function buildOption() {
  const maxV = Math.max(0, ...(provStat.value || []).map(d => d.value))
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (p) => {
        if (p.seriesType === 'map')  return `${p.name}：${p.value ?? 0}`
        if (p.seriesType === 'effectScatter') return `${p.data.name}<br/>健康指数：${p.data.value[2]}`
        if (p.seriesType === 'lines') return `${p.data.fromName} → ${p.data.toName}`
        return p.name || ''
      }
    },
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.15,
      itemStyle: {
        areaColor: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(14,165,233,.25)' },
          { offset: .7, color: 'rgba(56,189,248,.18)' },
          { offset: 1, color: 'rgba(2,6,23,.55)' }
        ]),
        borderColor: 'rgba(148,163,184,.45)',
        borderWidth: 1,
        shadowColor: 'rgba(34,211,238,.35)',
        shadowBlur: 18,
        shadowOffsetX: 0,
        shadowOffsetY: 8
      },
      label: { show: false },
      emphasis: { itemStyle: { areaColor: 'rgba(56,189,248,.42)' } }
    },
    visualMap: {
      type: 'continuous', min: 0, max: maxV || 300, orient: 'vertical',
      right: 12, bottom: 16, text: ['高','低'],
      inRange: { color: ['#0ea5e9','#22d3ee','#60a5fa','#93c5fd'] },
      textStyle: { color: 'rgba(255,255,255,.85)' }, itemWidth: 10, itemHeight: 120, calculable: true
    },
    series: [
      { // 阴影底图
        type: 'map', map: 'china', geoIndex: 0, silent: true, zlevel: 0,
        itemStyle: { areaColor: 'transparent', shadowColor: 'rgba(0,0,0,.55)', shadowBlur: 50, shadowOffsetY: 30, borderColor: 'transparent' }
      },
      { // 主热度
        name: '省份热度', type: 'map', map: 'china', geoIndex: 0, zlevel: 1, data: provStat.value
      },
      { // 省界描边
        type: 'map', map: 'china', geoIndex: 0, zlevel: 2, silent: true,
        itemStyle: { areaColor: 'transparent', borderColor: 'rgba(148,163,184,.65)', borderWidth: 1.2 }
      },
      { // 基地点
        name: '基地', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 3,
        rippleEffect: { brushType: 'stroke', scale: 3.6 },
        symbol: 'circle',
        symbolSize: (val) => 10 + (val[2] || 0) / 16,
        itemStyle: { color: '#7dd3fc' },
        label: { show: true, formatter: '{b}', position: 'right', color: 'rgba(255,255,255,.9)' },
        data: bases.value.map(b => ({ name: b.name, value: [...b.coord, b.value] }))
      },
      { // 扫描环
        name: '扫描', type: 'custom', coordinateSystem: 'geo', zlevel: 1,
        renderItem(params, api) {
          const coord = api.coord(centerHub.value.coord)
          const r = ringRadius
          return { type: 'circle', shape: { cx: coord[0], cy: coord[1], r },
            style: { fill: 'transparent', stroke: 'rgba(56,189,248,.55)', lineWidth: 2 }, silent: true }
        },
        data: [centerHub.value.coord]
      },
      { // 航线
        name: '联通', type: 'lines', zlevel: 4, coordinateSystem: 'geo',
        effect: { show: true, symbol: 'arrow', period: 4, trailLength: 0.4, symbolSize: 6, color: '#a5f3fc' },
        lineStyle: {
          width: 1.2,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: 'rgba(59,130,246,.1)' },
            { offset: 1, color: 'rgba(34,211,238,.85)' }
          ]),
          curveness: 0.2, shadowColor: 'rgba(34,211,238,.3)', shadowBlur: 10
        },
        data: toLineData()
      },
      { // 中控中心
        name: '中控中心', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 5,
        rippleEffect: { brushType: 'fill', scale: 5 }, symbolSize: 14, itemStyle: { color: '#22d3ee' },
        label: { show: true, formatter: '{b}', position: 'right', color: 'rgba(255,255,255,.95)' },
        data: [{ name: centerHub.value.name, value: [...centerHub.value.coord, 100] }]
      }
    ]
  }
}

function initChart() {
  loadMockData()
  echarts.registerMap('china', china)
  chart = echarts.init(chartEl.value)
  chart.setOption(buildOption())

  ringTimer = setInterval(() => {
    ringRadius += 1.6
    if (ringRadius > 80) ringRadius = 12
    chart.setOption({ series: [{}, {}, {}, {}, {}, {}, {}] }, false)
  }, 40)

  window.addEventListener('resize', onResize)
}
function onResize() { chart && chart.resize() }
onMounted(() => initChart())
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (ringTimer) clearInterval(ringTimer)
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style scoped>
.neon-panel{
  @apply relative rounded-xl border border-cyan-500/20 bg-white/5 dark:bg-white/5;
  box-shadow: inset 0 0 50px rgba(34,211,238,.12), 0 0 40px rgba(14,165,233,.12);
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
