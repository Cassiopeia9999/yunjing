<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden">
    <!-- 头部 -->
    <div class="px-4 py-3 bg-primary text-white flex items-center justify-between">
      <h3 class="text-sm font-semibold">
        {{ titlePrefix }}设备数据质量散点图
      </h3>
      <div class="flex items-center gap-2">
        <!-- 快捷时间范围 -->
        <select
            v-model="days"
            class="px-2 py-1 rounded text-neutral-900 dark:text-neutral-900 bg-white border border-white/30 focus:outline-none"
        >
          <option :value="7">近 7 天</option>
          <option :value="30">近 30 天</option>
          <option :value="100">近 100 天</option>
          <option :value="180">近 180 天</option>
          <option :value="365">近 365 天</option>
        </select>

        <!-- 导出/刷新 -->
        <button class="btn-ghost-white" @click="exportPng"><i class="fa fa-download mr-1"></i>导出</button>
        <button class="btn-ghost-white" @click="reload"><i class="fa fa-refresh mr-1"></i>刷新</button>
      </div>
    </div>

    <!-- 次标题+统计 -->
    <div class="px-4 py-2 text-xs text-neutral-600 dark:text-neutral-200 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
      <div>
        时间范围：{{ dateRangeText }} ｜ 点数：{{ total }} ｜ 正常：
        <span :style="{ color: normalColor }" class="font-medium">{{ normalCount }}</span> ｜ 异常：
        <span :style="{ color: abnormalColor }" class="font-medium">{{ abnormalCount }}</span>
      </div>

    </div>

    <!-- 图表 -->
    <div class="p-4 h-[420px]">
      <div ref="chartRef" class="w-full h-full"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { genQualityPoints } from '@/mock/deviceQualityMock'

// === Props ===
const props = defineProps({
  deviceKey: { type: [String, Number], default: '' },  // 外部设备标识（设备名或ID）
  defaultDays: { type: Number, default: 100 },         // 默认天数
  // 评估：超出范围视为异常（可在父级按需覆盖）
  kSigma: { type: Number, default: 2.0 },              // x/y 按均值±kσ
  confMin: { type: Number, default: 0.35 },
  confMax: { type: Number, default: 0.95 },
  titlePrefix: { type: String, default: '' }           // 自定义标题前缀
})

// === 颜色 & 深色模式 ===
const normalColor = '#2563eb'   // 正常：蓝
const abnormalColor = '#ef4444' // 异常：红
const isDark = ref(
    document.documentElement.classList.contains('dark') ||
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
)
const updateDark = () => {
  isDark.value =
      document.documentElement.classList.contains('dark') ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

// === 状态 ===
const days = ref(props.defaultDays)
const chartRef = ref(null)
let chart = null

const start = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - days.value)
  d.setHours(0, 0, 0, 0)
  return d
})
const end = computed(() => new Date())

const dateRangeText = computed(() => {
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return `${fmt(start.value)} ~ ${fmt(end.value)}`
})

const raw = ref({ points: [], stats: {} })
const total = computed(() => raw.value.points.length)

const kSigma = computed(() => props.kSigma)
const confMin = computed(() => props.confMin)
const confMax = computed(() => props.confMax)

// 点数随天数变化
const pointCountForDays = (d) => {
  const basePerDay = 12 // 每天大约多少点
  const n = Math.round(d * basePerDay)
  return Math.max(200, Math.min(n, 4000))
}

// 拆分正常/异常
const splitData = computed(() => {
  const { points, stats } = raw.value
  const { cx = 50, cy = 50, sx = 12, sy = 12 } = stats
  const k = kSigma.value
  const xmin = cx - k * sx, xmax = cx + k * sx
  const ymin = cy - k * sy, ymax = cy + k * sy

  const normal = []
  const abnormal = []
  for (const p of points) {
    const inRect = (p.x >= xmin && p.x <= xmax && p.y >= ymin && p.y <= ymax)
    const confOk = (p.value >= confMin.value && p.value <= confMax.value)
    const isAbn = !(inRect && confOk)
    const row = [p.x, p.y, p.value, p.ts]
    if (isAbn) abnormal.push(row)
    else normal.push(row)
  }
  return { normal, abnormal, rect: { xmin, xmax, ymin, ymax } }
})

const normalCount = computed(() => splitData.value.normal.length)
const abnormalCount = computed(() => splitData.value.abnormal.length)

// === 行为 ===
function reload() {
  // 重新生成 mock 数据（设备 or 时间范围变化）
  raw.value = genQualityPoints({
    deviceKey: props.deviceKey || '未命名设备',
    start: start.value,
    end: end.value,
    count: pointCountForDays(days.value)
  })
  render()
}

function exportPng() {
  if (!chart) return
  const bg = isDark.value ? '#0a0a0a' : '#ffffff'
  const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: bg })
  const a = document.createElement('a')
  a.href = url
  a.download = `quality_scatter_${props.deviceKey || 'unknown'}.png`
  a.click()
}

function render() {
  if (!chart) return
  const { normal, abnormal, rect } = splitData.value

  const axisColor = isDark.value ? '#d4d4d8' : '#404040'
  const splitLineColor = isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor = isDark.value ? '#e5e7eb' : '#374151'

  const tooltipFmt = params => {
    const [x, y, c, ts] = params.data
    const t = new Date(ts)
    const tStr = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`
    return [
      `<div><b>${params.seriesName}</b></div>`,
      `<div>x: ${x.toFixed(2)}，y: ${y.toFixed(2)}</div>`,
      `<div>时间: ${tStr}</div>`
    ].join('')
  }

  chart.clear() // 防止残留
  chart.setOption({
    grid: { left: 44, right: 60, top: 32, bottom: 44 },
    tooltip: {
      trigger: 'item',
      formatter: tooltipFmt,
      backgroundColor: isDark.value ? '#111827' : '#ffffff',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      textStyle: { color: textColor }
    },
    legend: {
      data: [
        { name: '正常', icon: 'circle' },
        { name: '异常', icon: 'circle' }
      ],
      top: 0,
      textStyle: { color: textColor }
    },
    xAxis: {
      type: 'value',
      name: 'X',
      nameGap: 12,
      axisLabel: { color: axisColor },
      nameTextStyle: { color: axisColor },
      axisLine: { lineStyle: { color: axisColor } },
      splitLine: { lineStyle: { color: splitLineColor } }
    },
    yAxis: {
      type: 'value',
      name: 'Y',
      nameGap: 12,
      axisLabel: { color: axisColor },
      nameTextStyle: { color: axisColor },
      axisLine: { lineStyle: { color: axisColor } },
      splitLine: { lineStyle: { color: splitLineColor } }
    },
    // 置信度可视映射（仅用于图例标尺；正常/异常各自有固定色）
    visualMap: [{
      show: true,
      dimension: 2,
      min: 0, max: 1,
      calculable: true,
      orient: 'vertical',
      right: 10, bottom: 20,
      text: ['置信度高', '置信度低'],
      textStyle: { color: textColor }
    }],
    series: [
      {
        name: '正常',
        type: 'scatter',
        data: normal,                 // [x, y, value, ts]
        symbolSize: d => 6 + 10 * d[2],
        itemStyle: { color: normalColor, opacity: 0.9 },
        emphasis: { focus: 'series' },
        z: 2
      },
      {
        name: '异常',
        type: 'scatter',
        data: abnormal,
        symbolSize: d => 6 + 10 * d[2],
        itemStyle: { color: abnormalColor, opacity: 0.95 },
        emphasis: { focus: 'series' },
        z: 3
      },
      // 评估矩形（μ±kσ）
      {
        name: '评估范围',
        type: 'custom',
        renderItem: (params, api) => {
          const p0 = api.coord([rect.xmin, rect.ymin])
          const p1 = api.coord([rect.xmax, rect.ymax])
          // 注意：echarts 坐标是左上原点，需要按 y 反向绘制
          return {
            type: 'rect',
            shape: { x: p0[0], y: p1[1], width: p1[0] - p0[0], height: p0[1] - p1[1] },
            style: {
              stroke: isDark.value ? '#10b981' : '#15803d',
              fill: isDark.value ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
              lineWidth: 1
            }
          }
        },
        silent: true,
        z: 1
      }
    ]
  })
}

// === 生命周期 & 监听 ===
function initChart() {
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value)
  render()
  window.addEventListener('resize', resize)
}
function resize() { chart && chart.resize() }

onMounted(() => {
  initChart()
  // 先 init 再 reload，保证有图
  reload()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (chart) chart.dispose()
})

// 设备与时间范围变化 → 重新生成数据并渲染
watch(() => props.deviceKey, () => reload())
watch(days, () => reload())
</script>

<style scoped>
:root { --primary-color: #165DFF; }
.bg-primary { background-color: var(--primary-color); }
.btn-ghost-white {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded text-sm
  bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50;
}
</style>
