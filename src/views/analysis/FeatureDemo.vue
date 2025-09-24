<template>
  <!-- 顶层：与全站一致 -->
  <div class="flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-2">
    <div class="flex h-full gap-3">
      <!-- 左侧面板 -->
      <aside class="w-full lg:w-[300px] shrink-0 h-full overflow-y-auto space-y-3">

        <!-- 数据选择卡 -->
        <el-card shadow="never" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <div class="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 rounded bg-[color:var(--primary-color)]"></span>
              <span class="text-sm font-semibold">数据选择</span>
            </div>
            <el-button @click="toggleFilter" size="small" text>{{ showFilter ? '收起' : '展开' }}</el-button>
          </div>

          <div class="p-3">
            <transition name="fade">
              <div v-show="showFilter" class="space-y-3">
                <PointSelector
                    :showFeatureSelector="false"
                    :cacheKey="'featureDemo'"
                    @data-ready="handleSelectedPoints"
                />
                <el-checkbox-group v-model="selectedFeatureNames" class="flex flex-wrap gap-2">
                  <div
                      v-for="name in availableFeatureNames"
                      :key="name"
                      class="px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                  >
                    <el-checkbox :label="name">{{ name }}</el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
            </transition>
          </div>
        </el-card>
      </aside>

      <!-- 右侧内容 -->
      <section class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <!-- 顶部工具栏（吸顶） -->
        <div class="sticky top-0 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-700">
          <!-- 原 sticky 工具栏内的内容，用下面这段替换 -->
          <div class="px-3 pt-2 pb-3">
            <!-- 行1：周期 / 时间范围 / 操作按钮 -->
            <div class="mb-2 grid grid-cols-12 gap-3 items-center">
              <!-- 周期选择 -->
              <el-select
                  v-model="selectedPeriodName"
                  placeholder="请选择周期"
                  clearable
                  size="default"
                  class="col-span-12 sm:col-span-3 w-full"
                  @change="onPeriodChange"
              >
                <el-option
                    v-for="item in periodOptions"
                    :key="item.period_name"
                    :label="item.period_name"
                    :value="item.period_name"
                />
              </el-select>

              <!-- 时间范围：占中间，宽度铺满 -->
              <el-date-picker
                  v-model="timeRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="起始时间"
                  end-placeholder="结束时间"
                  size="default"
                  class="col-span-12 sm:col-span-6 w-full"
              />

              <!-- 操作按钮：靠右对齐，按钮更醒目 -->
              <div class="col-span-12 sm:col-span-3 flex justify-end gap-2">
                <el-button :icon="Search" type="primary" size="default" class="min-w-[96px]" @click="refetchAllSelectedData">
                  查询
                </el-button>
                <el-button :icon="Histogram" type="primary" plain size="default" class="min-w-[96px]" @click="openForecastDialog">
                  预测
                </el-button>

                <!-- 在 行1 的操作按钮区域（查询/预测）后面追加这个按钮 -->
                <el-button
                    :icon="MagicStick"
                    size="default"
                    class="min-w-[96px]"
                    @click="classifyVisible = true"
                >
                  状态甄别
                </el-button>

                <!-- ✅ 新增：状态甄别按钮 -->
                <el-button
                    :icon="MagicStick"
                    size="default"
                    class="min-w-[96px]"
                    @click="featureValidationVisible = true"
                >
                  特征检验
                </el-button>

              </div>
            </div>

            <!-- 行2：标题 / 设置 -->
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="inline-block w-1.5 h-4 rounded bg-[color:var(--primary-color)]"></span>
                <h3 class="text-sm font-semibold">特征趋势图</h3>
              </div>
              <el-button :icon="Setting" @click="isConfigVisible = !isConfigVisible" size="small" text>设置</el-button>
            </div>

            <!-- 设置面板（保持不变） -->
            <transition name="fade">
              <div v-show="isConfigVisible" class="mt-2 flex items-center gap-3 text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-neutral-500 dark:text-neutral-400">只显示日期</span>
                  <el-switch v-model="showDateOnly" size="small" />
                </div>
                <el-button :icon="Download" size="small" @click="exportAllCharts">导出全部</el-button>
              </div>
            </transition>
          </div>

        </div>

        <!-- 图表列表（滚动区域） -->
        <div class="flex-1 overflow-y-auto pr-2 mt-2">
          <div v-if="noFeatureSelected" class="text-xs text-neutral-500 px-1 py-2">
            暂未选择任何特征，请在左侧勾选后查看趋势。
          </div>

          <div class="space-y-4">
            <div
                v-for="fname in selectedFeatureNames"
                :key="'card-'+fname"
                class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm"
            >
              <div class="px-3 py-2 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <div class="flex items-center gap-2">
                  <span class="inline-block w-1 h-4 rounded bg-[color:var(--primary-color)]"></span>
                  <h4 class="text-sm font-medium truncate">{{ fname }}</h4>
                </div>
                <el-button size="small" type="primary" plain @click="exportSingleChart(fname)">导出</el-button>
              </div>
              <div class="p-2">
                <!-- 关键：加唯一 key，避免复用导致的渲染异常；不改变渲染时机 -->
                <div :key="'chart-'+fname" :ref="el => (chartRefs[fname] = el)" class="h-[420px] w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 预测对话框（保持原逻辑） -->
    <FeatureForecastDialog
        v-model="forecastDialogVisible"
        :featureDataMap="featureDataMap"
        :deviceName="currentDevice ? currentDevice.device_name : ''"
        @complete="handleForecastResult"
    />

    <!-- 放在 FeatureForecastDialog 同级（它的下面/上面都可以） -->
    <el-dialog v-model="classifyVisible" title="状态甄别" width="740px" append-to-body>
      <StatusClassifier
          :features="featuresForClassifyFinal"
          :defaultX="featuresForClassifyFinal[0]?.name"
          :defaultY="featuresForClassifyFinal[1]?.name"
          :autorun="true"
          @classified="onClassified"
      />
      <template #footer>
        <el-button @click="classifyVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="featureValidationVisible" title="特征检验" width="820px" append-to-body>
      <FeatureValidation />
      <template #footer>
        <el-button @click="featureValidationVisible = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
/* —— 业务逻辑完全沿用你的原实现，仅修正模板易错点 —— */
import { ref, reactive, watch, nextTick, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { fetchTableData } from '@/api/querydata.js'
import { getSysConfigFormId } from '@/api/constant/form_constant.js'
import PointSelector from '@/buz/common/Selector.vue'
import { fetchParsedFeatureData, formatTimestamp } from '@/api/featureService.js'
import FeatureForecastDialog from '@/buz/feature/FeatureForecastDialog.vue'
import {Search, Histogram, Setting, Download, MagicStick} from '@element-plus/icons-vue'
import StatusClassifier from "@/components/alg/StatusClassifier.vue";
import { exampleFeatures } from '@/mock/statusClassifier.mock'
import FeatureValidation from "@/components/alg/FeatureValidation.vue";


// [新增 state]
const classifyVisible = ref(false)
const featureValidationVisible = ref(false)


// [新增 computed] 从已加载的曲线中取“最新点”拼成 [{name,value}] 传给分类组件
const featuresForClassify = computed(() => {
  const list = []
  for (const fname of selectedFeatureNames.value || []) {
    const arr = featureDataMap[fname] || []
    if (arr.length) {
      const last = arr[arr.length - 1]
      list.push({ name: fname, value: Number(last.feature_value) })
    }
  }
  return list
})


const featuresForClassifyFinal = computed(() => {
  const real = (featuresForClassify.value || [])
      .filter(i => typeof i?.value === 'number' && !Number.isNaN(i.value))
  return real.length >= 2 ? real : exampleFeatures
})

// [新增 回调]（可按需处理结果）
function onClassified(payload) {
  console.log('状态甄别结果：', payload)
}
/* UI 控制 */
const showFilter = ref(true)
const toggleFilter = () => (showFilter.value = !showFilter.value)
const isConfigVisible = ref(false)
const showDateOnly = ref(false)

/* 特征数据 */
const availableFeatureNames = ref([])
const selectedFeatureNames = ref([])
const noFeatureSelected = computed(() => (selectedFeatureNames.value && selectedFeatureNames.value.length) ? false : true)

const featureDataMap = reactive({})
const currentDevice = ref(null)

/* 图表管理 */
const chartRefs = reactive({})
const chartsMap = new Map()

function handleSelectedPoints({ device, features }) {
  const unique = [...new Set(features.map(d => d.feature_name))]
  availableFeatureNames.value = unique
  selectedFeatureNames.value = unique.slice(0, 1)
  currentDevice.value = device
}

/* 周期与时间 */
const periodOptions = ref([])
const timeRange = ref([]) // [start, end]
const selectedPeriodName = ref(null)
const selectedPeriod = ref(null)
function onPeriodChange(name) {
  selectedPeriod.value = periodOptions.value.find(p => p.period_name === name)
  if (selectedPeriod.value && selectedPeriod.value.start_time && selectedPeriod.value.end_time) {
    timeRange.value = [new Date(selectedPeriod.value.start_time), new Date(selectedPeriod.value.end_time)]
  }
}

/* 预测对话框 */
const forecastDialogVisible = ref(false)
function openForecastDialog() { forecastDialogVisible.value = true }
function handleForecastResult(result) { console.log('预测完成：', result) }

/* 初始化周期（原逻辑不变） */
fetchTableData(1, 1000, getSysConfigFormId("PERIOD_FORM_ID"), {})
    .then(res => {
      const list = res.data.list || []
      periodOptions.value = list
      if (list.length > 0) {
        const last = list[list.length - 1]
        selectedPeriodName.value = last.period_name
        onPeriodChange(last.period_name)
      }
    })
    .catch(err => console.error('加载周期数据失败:', err))

watch(selectedFeatureNames, async () => {
  await nextTick()
  for (const [name, chart] of chartsMap.entries()) {
    if (!selectedFeatureNames.value.includes(name)) {
      chart.dispose()
      chartsMap.delete(name)
      delete featureDataMap[name]
    }
  }
  for (const name of selectedFeatureNames.value) await fetchSingleFeatureData(name)
})

function refetchAllSelectedData() {
  for (const name of selectedFeatureNames.value) fetchSingleFeatureData(name)
}

async function fetchSingleFeatureData(featureName) {
  if (!currentDevice.value) return
  const range = timeRange.value || []
  const start = range[0]
  const end = range[1]
  if (!start || !end) return
  try {
    const startStr = new Date(start).toISOString()
    const endStr = new Date(end).toISOString()
    const deviceName = currentDevice.value.device_name
    const data = await fetchParsedFeatureData(deviceName, featureName, startStr, endStr)
    featureDataMap[featureName] = data
    renderChart(featureName)
  } catch (err) {
    console.error(`加载特征 ${featureName} 失败`, err)
  }
}

/* —— 仅 UI 的图表主题增强（逻辑不变） —— */
function renderChart(name) {
  const el = chartRefs[name]
  if (!el) return

  let chart = chartsMap.get(name)
  if (!chart) {
    chart = echarts.init(el)
    chartsMap.set(name, chart)
  }

  const data = (featureDataMap[name] || []).slice().sort((a, b) => a.cur_timestamp - b.cur_timestamp)
  const timestamps = data.map(d => showDateOnly.value ? formatTimestamp(d.cur_timestamp).split(' ')[0] : formatTimestamp(d.cur_timestamp))
  const values = data.map(d => d.feature_value)

  const isDark = document.documentElement.classList.contains('dark')
  const paletteLight = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F43F5E']
  const paletteDark  = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#A3E635', '#FB7185']
  const label = isDark ? '#e5e7eb' : '#374151'
  const axis  = isDark ? '#6b7280' : '#9ca3af'
  const split = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'
  const bgTip = isDark ? 'rgba(17,24,39,.96)' : 'rgba(255,255,255,.96)'
  const bdTip = isDark ? '#4b5563' : '#e5e7eb'

  chart.setOption({
    color: isDark ? paletteDark : paletteLight,
    textStyle: { color: label },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: bgTip,
      borderColor: bdTip,
      textStyle: { color: label }
    },
    grid: { left: 52, right: 24, top: 36, bottom: 40 },
    xAxis: {
      type: 'category',
      data: timestamps,
      axisLabel: { color: label },
      axisLine: { lineStyle: { color: axis } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: label },
      axisLine: { lineStyle: { color: axis } },
      splitLine: { show: true, lineStyle: { color: split } }
    },
    series: [{
      type: 'line',
      name,
      data: values,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2 },
      areaStyle: { opacity: .08 }
    }]
  })
}

/* 导出图表（保持你的写法） */
function exportSingleChart(name) {
  const chart = chartsMap.get(name)
  chart?.downloadImage?.({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
}
function exportAllCharts() {
  for (const name of selectedFeatureNames.value) exportSingleChart(name)
}

/* 清理 */
onUnmounted(() => {
  for (const chart of chartsMap.values()) chart.dispose()
  chartsMap.clear()
})
</script>

<style scoped>
:root { --primary-color: #165DFF; } /* 企业主色 */
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 压紧 Element 卡片默认内边距（与全站一致） */
:deep(.el-card__body){ padding: 0; }

/* 新增：让 datetimerange 在栅格中 100% 宽 */
:deep(.el-date-editor.el-range-editor.el-input__wrapper) { width: 100%; }
:deep(.el-range-editor.el-input__wrapper) { width: 100%; } /* 兼容不同版本 */
</style>
