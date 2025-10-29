<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden">
    <!-- 头部 -->
    <div class="px-4 py-3 bg-primary text-white flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-sm font-semibold">
        {{ titlePrefix }}设备数据质量散点图
      </h3>

      <div class="flex flex-wrap items-center gap-2">
        <!-- 时间范围 -->
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

        <!-- 过滤正常/异常 -->
        <select
            v-model="filterMode"
            class="px-2 py-1 rounded text-neutral-900 dark:text-neutral-900 bg-white border border-white/30 focus:outline-none"
        >
          <option value="all">全部</option>
          <option value="normal">只看正常</option>
          <option value="abnormal">只看异常</option>
        </select>

        <button class="btn-ghost-white" @click="exportPng"><i class="fa fa-download mr-1"></i>导出</button>
        <button class="btn-ghost-white" @click="reload"><i class="fa fa-refresh mr-1"></i>刷新</button>
      </div>
    </div>

    <!-- 次标题 -->
    <div class="px-4 py-2 text-xs text-neutral-600 dark:text-neutral-200 flex flex-wrap gap-2 items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
      <div>
        时间范围：{{ dateRangeText }}
        ｜点数：{{ filteredPoints.length }}
        ｜正常：<span class="text-green-600 font-semibold">{{ normalPoints.length }}</span>
        ｜异常：<span class="text-red-600 font-semibold">{{ abnormalPoints.length }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span>阈值矩形:</span>
        <span class="rounded px-2 py-[2px] text-[10px] font-mono bg-white/20 border border-white/30 text-white"
              style="background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.4);color:#10b981;">
          x∈[{{ xMin.toFixed(2) }}, {{ xMax.toFixed(2) }}], y∈[{{ yMin.toFixed(2) }}, {{ yMax.toFixed(2) }}]
        </span>
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
import { fetchTableData } from '@/api/querydata.js'
import { getSysConfigFormId } from '@/api/constant/form_constant.js'

// ===================== Props =====================
const props = defineProps({
  deviceKey: { type: [String, Number], default: '' }, // 设备ID / 名称（和 online_table_42.device_id 对应）
  defaultDays: { type: Number, default: 100 },        // 默认时间跨度
  titlePrefix: { type: String, default: '' }
})

// ===================== State =====================
const days = ref(props.defaultDays)
// "all" | "normal" | "abnormal"
const filterMode = ref('all')

// 原始点 [{x,y,value,ts}]
const scatterRaw = ref([])

// ===================== 时间范围 =====================
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

// ===================== 阈值矩形 =====================
// 简单策略：用当前点云的中位数 ± 某个跨度(比如四分位距 * 1.5)
// 这个区域就是“正常区”
// 落在里面 => normal，外面 => abnormal
function calcBox(values){
  if(!values.length) return {mid:0, low:0, high:0}
  const sorted = [...values].sort((a,b)=>a-b)
  const q1 = sorted[Math.floor(sorted.length*0.25)]
  const q2 = sorted[Math.floor(sorted.length*0.50)]
  const q3 = sorted[Math.floor(sorted.length*0.75)]
  // IQR:
  const iqr = q3 - q1
  return {
    mid:q2,
    low:q1 - 1.5*iqr,
    high:q3 + 1.5*iqr
  }
}

// 先从原始点中抽 x/y
const boxStats = computed(() => {
  const xs = scatterRaw.value.map(p => p.x)
  const ys = scatterRaw.value.map(p => p.y)

  const xb = calcBox(xs)
  const yb = calcBox(ys)

  // 防御一下范围太窄/太爆，可夹在 [0,1] 区间（因为你现在的点基本落在0~1）
  const clamp01 = v => Math.min(1, Math.max(0, v))

  return {
    xmin: clamp01(xb.low),
    xmax: clamp01(xb.high),
    ymin: clamp01(yb.low),
    ymax: clamp01(yb.high)
  }
})

const xMin = computed(() => boxStats.value.xmin || 0)
const xMax = computed(() => boxStats.value.xmax || 1)
const yMin = computed(() => boxStats.value.ymin || 0)
const yMax = computed(() => boxStats.value.ymax || 1)

// ===================== 正常/异常分类 =====================
const normalPoints = computed(() => {
  return scatterRaw.value.filter(p =>
      p.x >= xMin.value &&
      p.x <= xMax.value &&
      p.y >= yMin.value &&
      p.y <= yMax.value
  )
})

const abnormalPoints = computed(() => {
  return scatterRaw.value.filter(p =>
      !(p.x >= xMin.value &&
          p.x <= xMax.value &&
          p.y >= yMin.value &&
          p.y <= yMax.value)
  )
})

// 根据 filterMode，决定实际喂给图表的点
const filteredPoints = computed(() => {
  if (filterMode.value === 'normal') return normalPoints.value
  if (filterMode.value === 'abnormal') return abnormalPoints.value
  return scatterRaw.value
})

// ===================== 可视范围(让点居中) =====================
// 我们自动根据所有点的 min/max 给轴加 padding，让点不要挤在角落
const axisRange = computed(() => {
  if (!scatterRaw.value.length) {
    return { xMin:0, xMax:1, yMin:0, yMax:1 }
  }

  const xs = scatterRaw.value.map(p => p.x)
  const ys = scatterRaw.value.map(p => p.y)

  const xmin = Math.min(...xs)
  const xmax = Math.max(...xs)
  const ymin = Math.min(...ys)
  const ymax = Math.max(...ys)

  // 点云中心
  const cx = (xmin + xmax) / 2
  const cy = (ymin + ymax) / 2

  // 点云跨度
  const spanX = xmax - xmin
  const spanY = ymax - ymin
  let halfSpan = Math.max(spanX, spanY) / 2

  // 给一点额外空间，比如 2 倍放大
  halfSpan = halfSpan * 2 || 0.1  // 至少给0.1，避免单点时过小

  return {
    xMin: cx - halfSpan,
    xMax: cx + halfSpan,
    yMin: cy - halfSpan,
    yMax: cy + halfSpan
  }
})


// 用于颜色映射
const confMinVal = computed(() =>
    filteredPoints.value.length
        ? Math.min(...filteredPoints.value.map(p => p.value))
        : 0
)
const confMaxVal = computed(() =>
    filteredPoints.value.length
        ? Math.max(...filteredPoints.value.map(p => p.value))
        : 1
)

// ===================== ECharts =====================
const chartRef = ref(null)
let chart = null

const resize = () => { chart && chart.resize() }

function initChart() {
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value)
  window.addEventListener('resize', resize)
}

// ===================== 数据加载 =====================
async function reload() {
  if (!props.deviceKey) {
    scatterRaw.value = []
    render()
    return
  }

  const res = await fetchTableData(
      1,
      1000,
      getSysConfigFormId("Real_Time_Device_Data"),
      {}
  )

  const rows = Array.isArray(res?.data?.list) ? res.data.list : []
  const pts = []

  for (const r of rows) {
    // 提取设备ID
    const devId = typeof r.device_id === 'object' && r.device_id !== null
        ? (r.device_id.id || r.device_id.name || r.device_id.component_code || r.device_id)
        : r.device_id

    if (String(devId) !== String(props.deviceKey)) continue

    // 采集时间过滤
    const ct = r.collect_time ? new Date(r.collect_time.replace(/-/g, '/')) : null
    if (!ct || ct < start.value || ct > end.value) continue

    // 解析 file_quality
    let fq;
    try {
      // 尝试解析JSON
      fq = JSON.parse(r.file_quality);
      // 验证解析结果是否为对象（避免非对象类型导致后续属性访问错误）
      if (typeof fq !== 'object' || fq === null) {
        throw new Error('解析结果不是有效的对象');
      }
    } catch (error) {
      // 解析失败时输出错误信息（便于调试），并跳过当前数据
      console.error(`解析file_quality失败，数据行:`, r, '错误信息:', error.message);
      continue;
    }
    pts.push({
      x: Number(fq.x),
      y: Number(fq.y),
      value: Number(fq.value),
      ts: ct.getTime()
    })
  }

  scatterRaw.value = pts
  render()
}

// ===================== 导出 =====================
function exportPng() {
  if (!chart) return
  const url = chart.getDataURL({ type: 'png', pixelRatio: 2 })
  const a = document.createElement('a')
  a.href = url
  a.download = `quality_scatter_${props.deviceKey || 'unknown'}.png`
  a.click()
}

// ===================== 渲染 =====================
function render() {
  if (!chart) return

  // 转 echarts 数据结构
  // dataNormal / dataAbnormal 永远都计算出来，这样图例可以切换它们
  const dataNormal = normalPoints.value.map(p => [p.x, p.y, p.value, p.ts])
  const dataAbn    = abnormalPoints.value.map(p => [p.x, p.y, p.value, p.ts])

  const axisC = '#666'
  const splitC = '#ddd'
  const textC = '#333'

  const tooltipFmt = params => {
    const [x, y, val, ts] = params.data
    const t = new Date(ts)
    const tStr =
        `${t.getFullYear()}/${t.getMonth()+1}/${t.getDate()} ` +
        `${String(t.getHours()).padStart(2,'0')}:` +
        `${String(t.getMinutes()).padStart(2,'0')}:` +
        `${String(t.getSeconds()).padStart(2,'0')}`

    return [
      `<div><b>${params.seriesName}</b></div>`,
      `<div>质量值： ${val.toFixed(4)}</div>`,
      `<div>x: ${x.toFixed(4)}，y: ${y.toFixed(4)}</div>`,
      `<div>时间： ${tStr}</div>`
    ].join('')
  }

  // 矩形区域（正常区）作为 custom series
  const rectSeries = {
    name: '正常范围',
    type: 'custom',
    renderItem: (params, api) => {
      const p0 = api.coord([xMin.value, yMin.value])
      const p1 = api.coord([xMax.value, yMax.value])
      return {
        type: 'rect',
        shape: {
          x: p0[0],
          y: p1[1],
          width: p1[0] - p0[0],
          height: p0[1] - p1[1]
        },
        style: {
          stroke: '#10b981',
          fill: 'rgba(16,185,129,0.08)',
          lineWidth: 1
        }
      }
    },
    silent: true,
    z: 1
  }

  // 组装最终 series
  // 注意：我们不直接按 filterMode 过滤，这里全部画上
  // 但我们可以用 selected legend 来控制显示
  const series = [
    rectSeries,
    {
      name: '正常',
      type: 'scatter',
      data: dataNormal,
      symbolSize: 10,
      itemStyle: {
        opacity: 0.9
      },
      encode: { tooltip: [0,1,2,3] },
      z: 2
    },
    {
      name: '异常',
      type: 'scatter',
      data: dataAbn,
      symbolSize: 10,
      itemStyle: {
        opacity: 0.95
      },
      encode: { tooltip: [0,1,2,3] },
      z: 3
    }
  ]

  // 根据 filterMode 决定图例初始选择
  const selectedLegend = {
    '正常': filterMode.value !== 'abnormal',
    '异常': filterMode.value !== 'normal'
  }

  // visualMap 根据第三列 value 上色（正常/异常都会吃到这个调色）
  const visualMap = [{
    show: true,
    dimension: 2, // 第3列 = 质量值
    min: confMinVal.value,
    max: confMaxVal.value,
    calculable: true,
    orient: 'vertical',
    right: 10,
    bottom: 20,
    text: ['高', '低'],
    textStyle: { color: textC },
    inRange: {
      color: ['#ffff00', '#ffa500', '#ff0000'] // 黄→橙→红
    }
  }]

  chart.setOption({
    grid: { left: 44, right: 60, top: 32, bottom: 44 },

    tooltip: {
      trigger: 'item',
      formatter: tooltipFmt,
      backgroundColor: '#fff',
      borderColor: '#ddd',
      textStyle: { color: textC }
    },

    legend: {
      top: 0,
      data: ['正常', '异常'],
      selected: selectedLegend,
      textStyle: { color: textC }
    },

    xAxis: {
      type: 'value',
      name: 'X',
      min: axisRange.value.xMin,
      max: axisRange.value.xMax,
      axisLabel: { color: axisC },
      nameTextStyle: { color: axisC },
      splitLine: { lineStyle: { color: splitC } },
      axisLine: { lineStyle: { color: axisC } }
    },

    yAxis: {
      type: 'value',
      name: 'Y',
      min: axisRange.value.yMin,
      max: axisRange.value.yMax,
      axisLabel: { color: axisC },
      nameTextStyle: { color: axisC },
      splitLine: { lineStyle: { color: splitC } },
      axisLine: { lineStyle: { color: axisC } }
    },

    visualMap,
    series
  })
}

// ===================== 生命周期 =====================
onMounted(() => {
  initChart()
  reload()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (chart) chart.dispose()
})

// 监听外部/内部交互
watch(() => props.deviceKey, () => reload())
watch(days, () => reload())
watch(filterMode, () => render())   // 不重新拉数，只重画
watch(scatterRaw, () => render())
</script>

<style scoped>
:root { --primary-color: #165DFF; }
.bg-primary { background-color: var(--primary-color); }
.btn-ghost-white {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded text-sm
  bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50;
}
</style>
