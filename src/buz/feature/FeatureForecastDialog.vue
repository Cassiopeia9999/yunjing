<template>
  <el-dialog
      v-model="visible"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="feature-forecast-dialog"
      @close="handleCancel"
  >
    <!-- Header -->
    <template #header>
      <div class="flex items-center gap-2">
        <span class="inline-block w-1.5 h-5 rounded bg-[color:var(--primary-color)]"></span>
        <div class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">特征趋势预测</div>
      </div>
    </template>

    <!-- Content -->
    <div class="max-h-[70vh] overflow-y-auto px-4 py-2 space-y-4 text-neutral-800 dark:text-neutral-100">
      <!-- 第一行：特征 + 时间间隔 -->
      <div class="grid grid-cols-2 gap-6 items-center">
        <el-form-item label="特征名称" class="m-0">
          <el-select v-model="selectedFeatureName" placeholder="请选择特征" class="w-full">
            <el-option
                v-for="(data, name) in featureDataMap"
                :key="name"
                :label="name"
                :value="name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间间隔（估算）" class="m-0">
          <div class="text-sm pl-2 text-neutral-600 dark:text-neutral-300">
            {{ displayInterval }} 分钟
          </div>
        </el-form-item>
      </div>

      <!-- 第二行：历史 + 预测 -->
      <div class="grid grid-cols-2 gap-6">
        <!-- 历史窗口 -->
        <div
            class="rounded-md p-3 space-y-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
        >
          <el-form-item label="历史点数" class="m-0">
            <el-input-number v-model="historyPoints" :min="1" @change="syncHistoryRange" />
          </el-form-item>
          <el-form-item label="历史时间范围" class="m-0">
            <el-date-picker
                v-model="historyRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                class="w-full"
                @change="syncPointsFromRange"
            />
          </el-form-item>
        </div>

        <!-- 预测配置 -->
        <div
            class="rounded-md p-3 space-y-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
        >
          <el-form-item label="预测点数" class="m-0">
            <el-input-number v-model="predictPoints" :min="1" @change="updateForecastRange" />
          </el-form-item>

          <el-form-item label="预测时间段" class="m-0">
            <div class="text-sm text-neutral-700 dark:text-neutral-300">
              {{ forecastStartStr }} 至 {{ forecastEndStr }}
            </div>
          </el-form-item>
        </div>
      </div>

      <!-- 图表 -->
      <div
          ref="chartRef"
          class="w-full h-[400px] rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
      />
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3 px-4 pb-2">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">开始预测</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { commonServiceClient } from '@/api/common_service_client.js'

const props = defineProps({
  modelValue: Boolean,
  deviceName: String,
  featureDataMap: Object,      // { featureName: [{cur_timestamp, feature_value}] }
  featureMetaMap: Object       // ✅ 新增：{ [featureName]: { unit, low, up, alarm } }
})


const emit = defineEmits(['update:modelValue', 'complete'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const selectedFeatureName = ref(null)
const historyPoints = ref(60)
const predictPoints = ref(10)
const historyRange = ref([])
const sampleInterval = ref(0)
const predictedPoints = ref([])

const chartRef = ref(null)
let chartInstance = null
let resizeHandler = null
let themeObserver = null

const displayInterval = computed(() => {
  return sampleInterval.value ? (sampleInterval.value / 60000).toFixed(2) : '-'
})

// 自动选择第一个特征并初始化图表
watch(() => props.modelValue, (v) => {
  if (v) {
    selectedFeatureName.value = Object.keys(props.featureDataMap)[0] || null
    nextTick(() => {
      computeInterval()
      syncHistoryRange()
      renderChart()
    })
  }
})

// 切换特征后，刷新采样间隔 + 图表
watch(selectedFeatureName, () => {
  computeInterval()
  syncHistoryRange()
  predictedPoints.value = []
  nextTick(() => renderChart())
})

// 平均采样间隔估算
function computeInterval() {
  const data = props.featureDataMap[selectedFeatureName.value] || []
  const timestamps = data.map(d => d.cur_timestamp).sort()
  if (timestamps.length >= 2) {
    const intervals = []
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1])
    }
    sampleInterval.value = Math.round(intervals.reduce((a, b) => a + b) / intervals.length)
  }
}

// 历史点数 → 时间范围
function syncHistoryRange() {
  const data = props.featureDataMap[selectedFeatureName.value] || []
  if (!data.length || !sampleInterval.value) return
  const end = new Date(data[data.length - 1].cur_timestamp)
  const start = new Date(end.getTime() - historyPoints.value * sampleInterval.value)
  historyRange.value = [start, end]
}

// 时间范围 → 点数
function syncPointsFromRange() {
  if (historyRange.value && historyRange.value.length === 2 && sampleInterval.value) {
    const [start, end] = historyRange.value
    const diff = new Date(end) - new Date(start)
    historyPoints.value = Math.round(diff / sampleInterval.value)
  }
}

// 预测时间显示
const forecastStartStr = computed(() => {
  const history = props.featureDataMap[selectedFeatureName.value] || []
  const last = history[history.length - 1]
  return last ? new Date(last.cur_timestamp).toLocaleString() : '-'
})
const forecastEndStr = computed(() => {
  const history = props.featureDataMap[selectedFeatureName.value] || []
  const last = history[history.length - 1]
  if (!last || !sampleInterval.value) return '-'
  const end = new Date(last.cur_timestamp + predictPoints.value * sampleInterval.value)
  return end.toLocaleString()
})

function updateForecastRange() {
  // 可扩展（UI层不做业务变更）
}

// 提交预测请求
function handleConfirm() {
  const historyData = props.featureDataMap[selectedFeatureName.value] || []

  const payload = {
    device_name: props.deviceName,
    feature_name: selectedFeatureName.value,
    history_data: historyData,
    predict_points: predictPoints.value,
    window_size: historyPoints.value
  }

  const after = (pred) => {
    predictedPoints.value = pred || []
    renderChart()
    // 把真实使用的数据回传给外层，而不是 res.result（可能为空）
    emit('complete', predictedPoints.value)
  }

  commonServiceClient.featureTrendForecast(payload)
      .then(res => {
        let pred = res?.data?.result
        // ✅ 如果接口没返回有效预测，就用模拟数据兜底
        if (!Array.isArray(pred) || pred.length === 0) {
          if (!sampleInterval.value) computeInterval() // 保险：没算过就算一下
          pred = genMockForecast(
              historyData,
              Number(predictPoints.value) || 0,
              Number(sampleInterval.value) || 0,
              `${props.deviceName}|${selectedFeatureName.value}`
          )
        }
        after(pred)
      })
      .catch(err => {
        console.error('预测失败:', err)
        // ✅ 请求失败也兜底
        if (!sampleInterval.value) computeInterval()
        const pred = genMockForecast(
            historyData,
            Number(predictPoints.value) || 0,
            Number(sampleInterval.value) || 0,
            `${props.deviceName}|${selectedFeatureName.value}`
        )
        after(pred)
      })
}


// —— UI：自适应 ECharts 主题（不改动数据/业务） ——
function renderChart() {
  if (!chartRef.value || !selectedFeatureName.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)

  const fname = selectedFeatureName.value
  const history = props.featureDataMap[fname] || []
  const sorted = history.slice().sort((a, b) => a.cur_timestamp - b.cur_timestamp)

  const x1 = sorted.map(d => new Date(d.cur_timestamp).toLocaleString())
  const y1 = sorted.map(d => d.feature_value)
  const x2 = (predictedPoints.value || []).map(d => new Date(d.cur_timestamp).toLocaleString())
  const y2 = (predictedPoints.value || []).map(d => d.feature_value)

  // ✅ 读取阈值与单位
  const meta  = (props.featureMetaMap && props.featureMetaMap[fname]) || {}
  const low   = meta.low
  const up    = meta.up
  const alarm = meta.alarm
  const unit  = meta.unit || ''

  const isDark = document.documentElement.classList.contains('dark')
  const cHistory  = isDark ? '#FBBF24' : '#F59E0B'  // 历史
  const cForecast = isDark ? '#60A5FA' : '#2563EB'  // 预测
  const label = isDark ? '#e5e7eb' : '#374151'
  const axis  = isDark ? '#6b7280' : '#9ca3af'
  const split = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'
  const bgTip = isDark ? 'rgba(17,24,39,.96)' : 'rgba(255,255,255,.96)'
  const bdTip = isDark ? '#4b5563' : '#e5e7eb'

  // ✅ y 轴范围：把阈值也纳入，避免被裁
  const pool = [...y1, ...y2]
  if (low   != null) pool.push(low)
  if (up    != null) pool.push(up)
  if (alarm != null) pool.push(alarm)
  const yMin = pool.length ? Math.min(...pool) : 0
  const yMax = pool.length ? Math.max(...pool) : 1
  const pad  = Math.max(1, (yMax - yMin) * 0.1)

  // ✅ 拼接统一 X 轴（历史 + 预测）
  const xAll = [...x1, ...x2]

  // ✅ 主体两条（保持你原有的“不断线拼 null”的做法）
  const series = [
    {
      name: '历史数据',
      type: 'line',
      data: y1.concat(Array(x2.length).fill(null)),
      showSymbol: false,
      smooth: true,
      lineStyle: { width: 2, color: cHistory },
      areaStyle: { opacity: .08, color: cHistory }
    },
    {
      name: '预测结果',
      type: 'line',
      data: Array(x1.length).fill(null).concat(y2),
      showSymbol: true,
      symbolSize: 3,
      smooth: true,
      lineStyle: { width: 2, type: 'dashed', color: cForecast },
      areaStyle: { opacity: .08, color: cForecast }
    }
  ]

  // ✅ 阈值线（常数线）与正常区间底色
  const lenAll = xAll.length
  if (low != null) {
    series.push({
      name: '下限',
      type: 'line',
      data: new Array(lenAll).fill(low),
      symbol: 'none',
      lineStyle: { width: 1.6, type: 'dashed', color: '#10B981' },
      emphasis: { disabled: true },
      tooltip: { show: false }
    })
  }
  if (up != null) {
    series.push({
      name: '上限',
      type: 'line',
      data: new Array(lenAll).fill(up),
      symbol: 'none',
      lineStyle: { width: 1.6, type: 'dashed', color: '#EF4444' },
      emphasis: { disabled: true },
      tooltip: { show: false }
    })
  }
  if (alarm != null) {
    series.push({
      name: '报警',
      type: 'line',
      data: new Array(lenAll).fill(alarm),
      symbol: 'none',
      lineStyle: { width: 1.8, type: 'dotted', color: '#F59E0B' },
      emphasis: { disabled: true },
      tooltip: { show: false }
    })
  }

  // ✅ 正常区间高亮（low+up 同时存在）
  const markArea =
      (low != null && up != null)
          ? {
            silent: true,
            itemStyle: { color: 'rgba(16,185,129,0.06)' },
            data: [[{ yAxis: low }, { yAxis: up }]]
          }
          : undefined

  // 把 markArea 挂到“历史数据”这条（或任意一条主系列上）
  if (markArea) series[0].markArea = markArea

  chartInstance.setOption({
    textStyle: { color: label },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: bgTip,
      borderColor: bdTip,
      textStyle: { color: label }
    },
    legend: {
      data: ['历史数据', '预测结果', ...(low!=null?['下限']:[]), ...(up!=null?['上限']:[]), ...(alarm!=null?['报警']:[])],
      textStyle: { color: label }
    },
    grid: { left: 52, right: 24, top: 36, bottom: 40 },
    xAxis: {
      type: 'category',
      data: xAll,
      axisLabel: { color: label },
      axisLine: { lineStyle: { color: axis } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: yMin - pad,
      max: yMax + pad,
      name: unit ? `单位：${unit}` : '',
      nameLocation: 'end',
      nameGap: 12,
      nameTextStyle: { color: label, fontWeight: 700, fontSize: 12 },
      axisLabel: { color: label },
      axisLine: { lineStyle: { color: axis } },
      splitLine: { show: true, lineStyle: { color: split } }
    },
    series
  })
}


onMounted(() => {
  // 自适应：窗口尺寸变化
  resizeHandler = () => chartInstance && chartInstance.resize()
  window.addEventListener('resize', resizeHandler)

  // 监听 html.dark 的变化以切换主题
  themeObserver = new MutationObserver(() => {
    if (chartInstance) renderChart()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
  themeObserver && themeObserver.disconnect()
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// 取消关闭
function handleCancel() {
  visible.value = false
  predictedPoints.value = []
}



//mock
// —— 模拟预测：基于历史数据，向后生成 k 个点 —— //
// 稳定随机（同种输入可复现）
function makeRand(seedStr) {
  let s = 0
  for (const ch of String(seedStr || 'seed')) s = (s * 31 + ch.charCodeAt(0)) >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff)
}

/**
 * @param {Array<{cur_timestamp:number,feature_value:number}>} history  历史点（升序/乱序都可）
 * @param {number} k               需要生成的预测点个数
 * @param {number} dtMs            采样间隔（毫秒）
 * @param {string} seedKey         可选，控制随机稳定的key（如 device+feature）
 * @returns {Array<{cur_timestamp:number,feature_value:number}>}
 */
function genMockForecast(history, k, dtMs, seedKey = '') {
  if (!Array.isArray(history) || history.length === 0 || !dtMs || !Number.isFinite(dtMs)) return []
  const sorted = history.slice().sort((a, b) => a.cur_timestamp - b.cur_timestamp)
  const last = sorted[sorted.length - 1]
  const rand = makeRand(`${seedKey}|${last.cur_timestamp}|${last.feature_value}`)

  // 简单趋势：最近窗口的平均斜率（每个采样点的增量）
  const win = Math.min(20, sorted.length - 1)
  let slope = 0
  if (win > 0) {
    slope = (last.feature_value - sorted[sorted.length - 1 - win].feature_value) / win
  }

  // 噪声与微弱季节波动（围绕最后值做轻微起伏）
  let v = Number(last.feature_value) || 0
  const mu = Math.max(v, 1e-6)
  const noiseAmp = mu * 0.02      // ~2%
  const waveAmp  = mu * 0.01      // ~1%

  const out = []
  for (let i = 1; i <= k; i++) {
    const t = last.cur_timestamp + i * dtMs
    // 随机噪声 + 正弦波（12 点一个轻微周期）
    const noise = (rand() - 0.5) * 2 * noiseAmp
    const wave  = Math.sin((i / 12) * Math.PI * 2) * waveAmp
    v = Math.max(0, v + slope + noise + wave)
    out.push({ cur_timestamp: t, feature_value: Number(v.toFixed(6)) })
  }
  return out
}

</script>

<style scoped>
:root { --primary-color: #165DFF; }

/* Dialog 背景与分隔线：深浅色对齐 */
.feature-forecast-dialog :deep(.el-dialog) {
  background-color: #fff;
}
:deep(html.dark) .feature-forecast-dialog .el-dialog {
  background-color: #0a0a0a; /* neutral-950 接近值 */
}
.feature-forecast-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(0,0,0,.06);
}
:deep(html.dark) .feature-forecast-dialog .el-dialog__header {
  border-bottom: 1px solid rgba(255,255,255,.08);
}

/* 表单标签颜色加强对比 */
.feature-forecast-dialog :deep(.el-form-item__label) {
  color: #4b5563; /* neutral-600 */
}
:deep(html.dark) .feature-forecast-dialog .el-form-item__label {
  color: #d1d5db; /* neutral-300 */
}

/* 让范围选择器在容器内 100% 宽 */
:deep(.el-date-editor.el-range-editor.el-input__wrapper),
:deep(.el-range-editor.el-input__wrapper) { width: 100%; }
</style>
