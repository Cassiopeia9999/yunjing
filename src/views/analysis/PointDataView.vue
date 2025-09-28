<template>
  <div class="flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-2">
    <div class="flex h-full gap-3">
      <!-- 左侧：选择区 -->
      <aside class="w-full lg:w-[340px] shrink-0 h-full overflow-y-auto space-y-3">


          <!-- 让卡片内容可伸缩：flex-col + min-h-0 -->
          <div class="p-3 left-body">
            <!-- 行1：周期 + 操作 -->
            <div class="grid grid-cols-12 gap-2 items-center">
              <el-select
                  v-model="selectedPeriodName"
                  class="col-span-12"
                  placeholder="选择周期（特征分析）"
                  clearable
                  @change="onPeriodChange"
              >
                <el-option v-for="p in periodOptions" :key="p.period_name" :label="p.period_name" :value="p.period_name" />
              </el-select>

            </div>



              <div class="flex gap-2 justify-end">
                <el-button :icon="Search" type="primary" @click="queryRawFiles">查询</el-button>
                <el-button :icon="Refresh" @click="resetRange">重置</el-button>
              </div>


            <!-- 行2：时间范围 -->
            <el-date-picker
                v-model="timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="起始时间"
                end-placeholder="结束时间"
            />

            <!-- 原始数据文件 -->
            <div class="flex flex-col gap-2">
              <div class="sec-title">原始数据文件（{{ filteredRawFiles.length }}）</div>

              <!-- 过滤输入框 -->
              <el-input
                  v-model="rawKeyword"
                  size="small"
                  class="w-full"
                  clearable
                  :prefix-icon="Search"
                  placeholder="过滤：文件名 / 时间"
              />

              <!-- 列表：竖向，一行一个 -->
              <el-scrollbar max-height="280">
                <div class="list-box">
                  <div
                      v-for="f in filteredRawFiles"
                      :key="f.id"
                      class="file-row"
                      :class="{ active: selectedRawId === f.id }"
                      @click="selectRaw(f.id)"
                  >
                    <div class="file-title truncate">{{ f.file_name }}</div>
                    <div class="file-sub">
                      <span class="time-pill">{{ formatTime(f.collect_time) }}</span>
                    </div>
                  </div>
                </div>
              </el-scrollbar>

              <div v-if="!filteredRawFiles.length" class="hint">暂无原始数据</div>
            </div>

            <!-- 测点：占据剩余空间 -->
            <div class="points-section">
              <div class="sec-title">测点（{{ points.length }}）</div>
              <el-scrollbar class="points-scroll">
                <div class="list-box">
                  <div
                      v-for="p in points"
                      :key="p.id"
                      class="list-row"
                      :class="{ active: selectedPointId === p.id }"
                      @click="selectPoint(p.id)"
                  >
                    <div class="truncate">{{ p.point_name }}</div>
                    <div class="badge">{{ formatSamplePeriod(p.sample_rate) }}</div>
                  </div>
                </div>
              </el-scrollbar>

              <div v-if="selectedPointMeta" class="meta">
                采样间隔：<b>{{ sampleIntervalSec }}</b> 秒 ｜ 点数：<b>{{ selectedPointMeta.length }}</b> ｜ 时长：<b>{{ durationSec }} s</b>
              </div>
            </div>
          </div>
      </aside>


      <!-- 右侧：图表（你的现有逻辑保持不变） -->
      <section class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div class="sticky top-0 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-700">
          <div class="px-3 pt-2 pb-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 rounded bg-[color:var(--primary-color)]"></span>
              <el-tag size="small" effect="dark" class="title-tag">{{ currentPointTitle }}</el-tag>
            </div>
            <div class="flex items-center gap-2">
              <el-button size="small" :icon="Download" @click="exportPng" :disabled="!chartInstance">导出图像</el-button>
              <el-button size="small" :icon="Document" @click="exportCsv" :disabled="!waveform.values?.length">导出CSV</el-button>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-auto p-2">
          <el-card shadow="never" class="dark:bg-neutral-800">
            <div ref="chartRef" class="h-[780px] w-full"></div>
          </el-card>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { Search, Refresh, Download, Document } from '@element-plus/icons-vue'

// ① 周期：优先从“特征分析”的周期表获取；失败再用 mock 兜底
import { fetchTableData } from '@/api/querydata.js'
import { getSysConfigFormId } from '@/api/constant/form_constant.js'
import {
  mockListPeriods,            // 兜底：本地 mock
  mockFetchRawFiles,
  mockFetchPointsInRaw,
  mockFetchPointSeries
} from '@/mock/pointRowData'

// ====== 左侧：周期/时间 ======
const periodOptions = ref([])
const selectedPeriodName = ref(null)
const timeRange = ref([])

function setRange(start, end){
  timeRange.value = [new Date(start), new Date(end)]
}
function onPeriodChange(name){
  const p = periodOptions.value.find(i => i.period_name === name)
  if (p) setRange(p.start_time, p.end_time)     // 周期只负责回填时间
}
function resetRange(){
  const now = Date.now()
  setRange(now - 7*24*3600*1000, now)           // 默认近7天
  selectedPeriodName.value = null
}

// ① 新增：过滤关键字 + 过滤后的文件列表
const rawKeyword = ref('')

const filteredRawFiles = computed(() => {
  const list = rawFiles.value || []
  const k = (rawKeyword.value || '').trim().toLowerCase()
  if (!k) return list
  return list.filter(f =>
      (f.file_name || '').toLowerCase().includes(k) ||
      formatTime(f.collect_time).toLowerCase().includes(k)
  )
})

// 采样间隔格式化：把 Hz 改成人能读的“每 N 秒/分钟/小时/天”
function formatSamplePeriod(sr) {
  const n = Number(sr)
  if (!Number.isFinite(n) || n <= 0) return '—'
  const sec = 1 / n

  // 可读化（优先用更大的单位）
  if (sec >= 86400) return `每 ${Math.round(sec / 86400)} 天`
  if (sec >= 3600)  return `每 ${Math.round(sec / 3600)} 小时`
  if (sec >= 60)    return `每 ${Math.round(sec / 60)} 分钟`
  return `每 ${Math.round(sec)} 秒`
}

// 选中测点的采样间隔（秒，整数）
const sampleIntervalSec = computed(() => {
  const sr = Number(selectedPointMeta.value?.sample_rate)
  if (!Number.isFinite(sr) || sr <= 0) return 0
  return Math.round(1 / sr)
})

// 真正使用的查询，**始终**以 timeRange 为准
async function queryRawFiles(){
  const [start, end] = timeRange.value || []
  if(!start || !end) return
  rawFiles.value = await mockFetchRawFiles({ start, end })
  selectedRawId.value = rawFiles.value[0]?.id ?? null
  await loadPoints()
}

// ====== 原始数据文件 & 测点 ======
const rawFiles = ref([])
const selectedRawId = ref(null)

const points = ref([])
const selectedPointId = ref(null)

const selectedPointMeta = ref(null) // { sample_rate, length, unit }
const waveform = ref({ sample_rate: 0, unit: '', values: [] })

async function loadPoints(){
  points.value = selectedRawId.value ? await mockFetchPointsInRaw(selectedRawId.value) : []
  selectedPointId.value = points.value[0]?.id ?? null
  await loadWaveform()
}

function selectRaw(id){
  if (selectedRawId.value === id) return
  selectedRawId.value = id
  loadPoints()
}

function selectPoint(id){
  if (selectedPointId.value === id) return
  selectedPointId.value = id
  loadWaveform()
}

const currentPointTitle = computed(()=>{
  const f = rawFiles.value.find(i=>i.id===selectedRawId.value)
  const p = points.value.find(i=>i.id===selectedPointId.value)
  return p ? `${p.point_name} @ ${f?.file_name ?? '—'}` : '未选择测点'
})

const durationSec = computed(()=>{
  if(!selectedPointMeta.value) return 0
  const { sample_rate, length } = selectedPointMeta.value
  return sample_rate ? (length / sample_rate).toFixed(3) : 0
})

// ====== 波形 & 图表（保持你原先实现） ======
const chartRef = ref(null)
let chartInstance = null

async function loadWaveform(){
  if(!selectedRawId.value || !selectedPointId.value) return
  const series = await mockFetchPointSeries(selectedRawId.value, selectedPointId.value)
  waveform.value = series
  selectedPointMeta.value = {
    sample_rate: series.sample_rate,
    length: series.values.length,
    unit: series.unit
  }
  await nextTick()
  renderChart()
}
function renderChart(){
  if (!chartRef.value) return
  if (chartInstance){ chartInstance.dispose(); chartInstance = null }
  chartInstance = echarts.init(chartRef.value)

  const sr = Number(waveform.value.sample_rate) || 1      // Hz
  const stepSec = 1 / sr                                   // 每点对应的秒数
  const values  = waveform.value.values || []
  const unit    = waveform.value.unit || ''
  const xData   = Array.from({ length: values.length }, (_, i) => i)  // [0..N-1]

  const pad2 = n => String(n).padStart(2,'0')
  const formatRel = (sec) => {
    if (sec < 60) return `${Math.round(sec)}s`
    const m = Math.round(sec/60)
    if (m < 60) return `${m}m`
    const h = Math.floor(m/60), mm = pad2(m%60)
    if (h < 24) return `${pad2(h)}:${mm}`
    const d = Math.floor(h/24), hh = pad2(h%24)
    return `${d}d ${hh}:${mm}`
  }

  chartInstance.setOption({
    grid: { left: 54, right: 22, top: 12, bottom: 48 },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          formatter: p => p.axisDimension === 'x'
              ? formatRel(Number(p.value) * stepSec)   // ✅ 用 value
              : p.value
        }
      },
      formatter: list => {
        if (!list?.length) return ''
        const d = list[0]
        const tSec = Number(d.axisValue) * stepSec    // ✅ 用 axisValue
        return `${formatRel(tSec)}<br/>${d.marker} ${d.seriesName}&nbsp;<b>${d.value} ${unit}</b>`
      }
    },
    dataZoom: [
      { type: 'inside', throttle: 16 },
      { type: 'slider', height: 22, labelFormatter: v => formatRel(Number(v) * stepSec) }
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,                                     // ✅ 首次就带上
      axisLabel: {
        // ✅ 用“类目值”换算，不用 index
        formatter: (value) => formatRel(Number(value) * stepSec)
      }
    },
    yAxis: { type: 'value', axisLabel: { formatter: v => `${v}` } },
    series: [{
      type: 'line',
      name: 'wave',
      data: values,
      showSymbol: false,
      smooth: false,
      sampling: 'lttb',
      animation: false,
      lineStyle: { width: 1.5 }
    }]
  })

  // ❌ 不再二次 setOption 去补 xAxis.data
}



function exportPng(){
  if(!chartInstance) return
  const url = chartInstance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
  const a = document.createElement('a'); a.href = url; a.download = `point_wave_${Date.now()}.png`; a.click()
}
function exportCsv(){
  const sr = Number(waveform.value.sample_rate) || 1
  const stepSec = 1 / sr
  const values = waveform.value.values || []

  const rows = ['t(sec),value']
  for (let i = 0; i < values.length; i++) {
    rows.push(`${(i * stepSec).toFixed(6)},${values[i]}`)
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `point_wave_${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}


// 加载“特征分析”的周期；失败时用 mock 兜底
async function loadFeaturePeriods(){
  try{
    const res = await fetchTableData(1, 1000, getSysConfigFormId("PERIOD_FORM_ID"), {})
    periodOptions.value = (res?.data?.list || []).map(i => ({
      period_name: i.period_name,
      start_time:  i.start_time,
      end_time:    i.end_time
    }))
  }catch(e){
    periodOptions.value = await mockListPeriods()
  }
  // 默认：选最后一条周期并回填时间
  if(periodOptions.value.length){
    const last = periodOptions.value[periodOptions.value.length - 1]
    selectedPeriodName.value = last.period_name
    onPeriodChange(last.period_name)
  }else{
    resetRange()
  }
}

onMounted(async ()=>{
  await loadFeaturePeriods()
  await queryRawFiles()
})

onBeforeUnmount(()=>{ if(chartInstance){ chartInstance.dispose(); chartInstance = null } })

// 小工具
function formatTime(ts){
  if(!ts) return '—'
  const d = new Date(ts); const p = n => String(n).padStart(2,'0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
</script>

<style scoped>
:root { --primary-color: #42c5f6; }
.sec-title{ @apply text-xs text-neutral-500 mb-1; }
.hint{ @apply text-xs text-neutral-500 mt-1; }
.meta{ @apply text-xs text-neutral-600 dark:text-neutral-300 mt-2; }

.title-tag{
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  font-size: 16px;
  color: #9c9da3; font-weight:700; border-radius:4px; padding: 2px 10px;
}

/* 竖向列表样式 */
.list-box{ @apply border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden bg-neutral-50 dark:bg-neutral-800; }
.list-row{
  @apply px-1 py-1.5 text-sm flex items-center justify-between cursor-pointer
  border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700;
}
.list-row:last-child{ border-bottom: 0; }
.list-row.active{ @apply bg-sky-50 dark:bg-sky-900/40; box-shadow: inset 3px 0 0 0 var(--primary-color); }
.badge{ @apply text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700; }


/* 让左侧卡片内容可拉伸，测点占满剩余空间 */
.left-body{
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;        /* very important: 允许子元素滚动 */
}

/* 通用列表框 */
.list-box{
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0,0,0,.02);
}
.dark .list-box{ background: rgba(255,255,255,.04); }

/* 原始文件：两行布局 */
.file-row{
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color);
}
.file-row:last-child{ border-bottom: 0; }
.file-row:hover{ background: rgba(0,0,0,.04); }
.dark .file-row:hover{ background: rgba(255,255,255,.06); }
.file-row.active{
  background: rgba(66,197,246,.10);
  box-shadow: inset 3px 0 0 0 var(--primary-color);
}
.file-title{ font-weight: 600; }
.file-sub{ display: flex; justify-content: flex-end; }
.time-pill{
  font-size: 12px; line-height: 1;
  padding: 6px 10px;
  border-radius: 9999px;
  background: #eee;
  color: #1c1c1c;
}
.dark .time-pill{ background: #3b3b3b; color: #ddd; }

/* 测点区域：占据剩余空间并可滚动 */
.points-section{
  display: flex; flex-direction: column; min-height: 0; flex: 1;
}
.points-scroll{ flex: 1; min-height: 0; }

/* 通用一行项（测点） */
.list-row{
  padding: 8px 10px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color);
}
.list-row:last-child{ border-bottom: 0; }
.list-row:hover{ background: rgba(0,0,0,.04); }
.dark .list-row:hover{ background: rgba(255,255,255,.06); }
.list-row.active{
  background: rgba(66,197,246,.10);
  box-shadow: inset 3px 0 0 0 var(--primary-color);
}
.badge{
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 9999px;
  background: #e5e7eb;
  color: #374151;
}
.dark .badge{ background:#414141; color:#e5e7eb; }

</style>
