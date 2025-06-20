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
      <div class="text-lg font-semibold text-gray-800">特征趋势预测</div>
    </template>

    <!-- Content -->
    <div class="max-h-[70vh] overflow-y-auto px-4 py-2 space-y-4">
      <!-- 第一行：特征 + 时间间隔 -->
      <div class="grid grid-cols-2 gap-6 items-center">
        <el-form-item label="特征名称">
          <el-select v-model="selectedFeatureName" placeholder="请选择特征" class="w-full">
            <el-option v-for="(data, name) in featureDataMap" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间间隔（估算）">
          <div class="text-gray-600 text-sm pl-2">{{ displayInterval  }} 分钟</div>
        </el-form-item>
      </div>

      <!-- 第二行：历史 + 预测 -->
      <div class="grid grid-cols-2 gap-6">
        <!-- 历史窗口 -->
        <div class="border border-gray-200 rounded-md p-3 space-y-3">
          <el-form-item label="历史点数">
            <el-input-number v-model="historyPoints" :min="1" @change="syncHistoryRange" />
          </el-form-item>
          <el-form-item label="历史时间范围">
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
        <div class="border border-gray-200 rounded-md p-3 space-y-3">
          <el-form-item label="预测点数">
            <el-input-number v-model="predictPoints" :min="1" @change="updateForecastRange" />
          </el-form-item>

          <el-form-item label="预测时间段">
            <div class="text-gray-700 text-sm">{{ forecastStartStr }} 至 {{ forecastEndStr }}</div>
          </el-form-item>
        </div>
      </div>

      <!-- 图表 -->
      <div ref="chartRef" class="w-full h-[400px] border rounded-md shadow-sm bg-white" />
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
import { ref, watch, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { commonServiceClient } from '@/api/commonServiceClient'

const props = defineProps({
  modelValue: Boolean,
  deviceName: String,
  featureDataMap: Object // { featureName: [{cur_timestamp, feature_value}] }
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
  if (historyRange.value?.length === 2 && sampleInterval.value) {
    const [start, end] = historyRange.value
    const diff = new Date(end) - new Date(start)
    historyPoints.value = Math.round(diff / sampleInterval.value)
  }
}

// 预测时间显示（预测开始 = 历史最后时间）
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
  // 可扩展用法
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

  commonServiceClient.featureTrendForecast(payload)
      .then(res => {
        predictedPoints.value = res.data.result || []
        renderChart()
        emit('complete', res.result)
      })
      .catch(err => {
        console.error('预测失败:', err)
      })
}

// 渲染图表
function renderChart() {
  if (!chartRef.value || !selectedFeatureName.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)

  const history = props.featureDataMap[selectedFeatureName.value] || []
  const sorted = history.slice().sort((a, b) => a.cur_timestamp - b.cur_timestamp)

  const x1 = sorted.map(d => new Date(d.cur_timestamp).toLocaleString())
  const y1 = sorted.map(d => d.feature_value)
  const x2 = predictedPoints.value.map(d => new Date(d.cur_timestamp).toLocaleString())
  const y2 = predictedPoints.value.map(d => d.feature_value)

  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['历史数据', '预测结果'] },
    xAxis: { type: 'category', data: [...x1, ...x2] },
    yAxis: { type: 'value' },
    series: [
      { name: '历史数据', type: 'line', data: y1, lineStyle: { color: 'orange' } },
      { name: '预测结果', type: 'line', data: y2, lineStyle: { type: 'dashed', color: '#007AFF' } }
    ]
  })
}

// 取消关闭
function handleCancel() {
  visible.value = false
  predictedPoints.value = []
}
</script>

<style scoped>
/* Chart 高度保留原样 */
.h-\[600px\] {
  height: 600px;
}
</style>
