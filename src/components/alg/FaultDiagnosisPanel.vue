<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  fdFeatureOptions,
  getRecentChannelDataMock,
  runFaultDiagnosisMock
} from '@/mock/faultDiagnosis.mock'

// ========== Props（都可省略：不传则使用 mock 自动出效果） ==========
const props = defineProps({
  deviceName: { type: String, default: 'Device-A' },
  channel: { type: String, default: 'CH-1' },
  featureOptions: { type: Array, default: () => fdFeatureOptions },
  recentData: { type: Array, default: () => [] },         // [{t,value}]
  defaultX: { type: String, default: 'rms' },
  defaultY: { type: String, default: 'kurtosis' },
  autorun: { type: Boolean, default: true }
})
const emit = defineEmits(['run', 'save', 'error'])

// ========== 本地状态 ==========
const xFeature = ref(props.defaultX)
const yFeature = ref(props.defaultY)
const windowSize = ref(600) // 最近点数（用于降采样/窗口）
const running = ref(false)
const points = ref([])      // [{time,x,y,result,confidence}]
const selectedIdx = ref(new Set())  // brush 选中索引
const chartRef = ref(null)
let chart

// UI：图例颜色（浅/深）
const isDark = () => document.documentElement.classList.contains('dark')
const palette = computed(() => isDark()
    ? { normal: '#60A5FA', warning: '#FBBF24', fault: '#F87171', grid: 'rgba(255,255,255,.06)', axis: '#9CA3AF', label: '#E5E7EB', tipBg: 'rgba(17,24,39,.96)', tipBd:'#4B5563' }
    : { normal: '#2563EB', warning: '#F59E0B', fault: '#EF4444', grid: 'rgba(0,0,0,.06)', axis: '#9CA3AF', label: '#374151', tipBg: 'rgba(255,255,255,.96)', tipBd:'#E5E7EB' }
)

// 统计
const stat = computed(() => {
  const all = points.value || []
  const c = { total: all.length, normal: 0, warning: 0, fault: 0, high: 0 }
  all.forEach(p => {
    if (p.result === 'Normal') c.normal++
    else if (p.result === 'Warning') c.warning++
    else if (p.result === 'Fault') c.fault++
    if ((p.confidence ?? 0) >= 0.8) c.high++
  })
  return c
})

// 最近一次运行的元信息（保存用）
const lastRunMeta = ref(null)

// ========== 数据准备（mock 兜底） ==========
const dataSource = ref([])
function ensureData() {
  if (props.recentData?.length) {
    dataSource.value = props.recentData.slice(-Math.max(windowSize.value, 200))
  } else {
    dataSource.value = getRecentChannelDataMock().slice(-windowSize.value)
  }
}

// ========== 运行诊断 ==========
async function runDiagnosis() {
  try {
    if (!xFeature.value || !yFeature.value) return
    ensureData()
    running.value = true
    emit('run', { xFeature: xFeature.value, yFeature: yFeature.value, channel: props.channel, windowSize: windowSize.value })
    const { points: res } = runFaultDiagnosisMock({
      data: dataSource.value,
      xFeature: xFeature.value,
      yFeature: yFeature.value
    })
    points.value = res
    lastRunMeta.value = {
      at: new Date(),
      device: props.deviceName,
      channel: props.channel,
      xFeature: xFeature.value, yFeature: yFeature.value,
      total: res.length
    }
    await nextTick()
    renderChart()
  } catch (e) {
    console.error(e)
    emit('error', e)
  } finally {
    running.value = false
  }
}

// ========== 保存结果（交给父级接接口） ==========
function saveResult() {
  const payload = {
    meta: lastRunMeta.value,
    points: points.value
  }
  emit('save', payload)
}

// ========== 清空 ==========
function clearAll() {
  points.value = []
  selectedIdx.value = new Set()
  if (chart) chart.clear()
}

// ========== 导出 CSV ==========
function exportCSV() {
  if (!points.value?.length) return
  const headers = ['time', 'x', 'y', 'result', 'confidence']
  const rows = points.value.map(p => [
    new Date(p.time).toISOString(),
    p.x, p.y, p.result, p.confidence
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `fault_diagnosis_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ========== 图表 ==========
function symbolSizeByConf(c) {
  return 6 + Math.round(8 * (Math.max(0, Math.min(1, c)) || 0))
}

function splitByClass(arr) {
  const n = [], w = [], f = []
  arr.forEach((p, idx) => {
    const v = [p.x, p.y, p.confidence, idx] // idx 用于联动
    if (p.result === 'Fault') f.push(v)
    else if (p.result === 'Warning') w.push(v)
    else n.push(v)
  })
  return { n, w, f }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  const { n, w, f } = splitByClass(points.value || [])
  const pal = palette.value

  const baseSeries = (name, data, color) => ({
    name, type: 'scatter', data,
    symbolSize: (val) => symbolSizeByConf(val[2]),
    itemStyle: { color },
    emphasis: { focus: 'series' },
    progressive: 2000
  })

  chart.setOption({
    textStyle: { color: pal.label },
    tooltip: {
      trigger: 'item',
      backgroundColor: pal.tipBg,
      borderColor: pal.tipBd,
      textStyle: { color: pal.label },
      formatter: (p) => {
        const idx = p.value?.[3]
        const row = points.value[idx]
        return [
          `<div style="font-weight:600;margin-bottom:4px">${row?.result || '-'}</div>`,
          `时间：${new Date(row?.time).toLocaleString()}`,
          `x(${xFeature.value})：${(row?.x??'').toFixed?.(4) ?? row?.x}`,
          `y(${yFeature.value})：${(row?.y??'').toFixed?.(4) ?? row?.y}`,
          `置信度：${((row?.confidence ?? 0)*100).toFixed(1)}%`
        ].join('<br/>')
      }
    },
    grid: { left: 52, right: 24, top: 56, bottom: 48 },
    xAxis: {
      name: xFeature.value,
      nameTextStyle: { fontWeight: 600, padding: [0,0,6,0] },
      type: 'value',
      axisLine: { lineStyle: { color: pal.axis } },
      splitLine: { show: true, lineStyle: { color: pal.grid } }
    },
    yAxis: {
      name: yFeature.value,
      nameTextStyle: { fontWeight: 600, padding: [0,0,0,6] },
      type: 'value',
      axisLine: { lineStyle: { color: pal.axis } },
      splitLine: { show: true, lineStyle: { color: pal.grid } }
    },
    legend: {
      top: 8,
      left: 12,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: pal.label },
      data: [
        { name:'Normal', icon: 'circle' },
        { name:'Warning', icon: 'circle' },
        { name:'Fault',  icon: 'circle' }
      ]
    },
    brush: { toolbox: ['rect', 'polygon', 'keep', 'clear'], xAxisIndex: 'all', yAxisIndex: 'all' },
    series: [
      baseSeries('Normal', n, pal.normal),
      baseSeries('Warning', w, pal.warning),
      baseSeries('Fault',   f, pal.fault)
    ]
  }, { notMerge: true })

  chart.off('brushSelected')
  chart.on('brushSelected', (e) => {
    const sel = new Set()
    e.batch?.forEach(b => {
      b.selected?.forEach(s => {
        s.dataIndex?.forEach(di => {
          const v = (s.seriesIndex === 0 ? n : s.seriesIndex === 1 ? w : f)[di]
          const idx = v?.[3]
          if (idx != null) sel.add(idx)
        })
      })
    })
    selectedIdx.value = sel
  })

  chart.resize()
}

window.addEventListener('resize', () => chart?.resize())
const activeTab = ref('visual')
// ========== 表格数据 ==========
const tableData = computed(() => {
  return (points.value || []).map((p, i) => ({
    ...p,
    timeStr: new Date(p.time).toLocaleString(),
    _i: i,
    _selected: selectedIdx.value.has(i)
  }))
})

// ========== 自动首跑 ==========
onMounted(async () => {
  if (props.autorun) {
    await runDiagnosis()
  } else {
    await nextTick(); renderChart()
  }
})
</script>

<template>
  <div class="flex flex-col min-h-[560px] text-neutral-900 dark:text-neutral-100">
    <div
        class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-gradient-to-r
             from-indigo-50 via-sky-50 to-violet-50 dark:from-indigo-950/40 dark:via-sky-950/30 dark:to-violet-950/30
             p-3 mb-3"
    >
      <div class="flex flex-wrap items-center gap-3 mb-2">
        <div class="inline-flex items-center gap-2 px-2 py-1 rounded-full
                    bg-indigo-600 text-white text-xs shadow-sm">
          <span class="w-2 h-2 rounded-full bg-white/80"></span>
          {{ deviceName }} · {{ channel }}
        </div>

        <div class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs
                    bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
          支持框选联动 & 导出
        </div>
      </div>

      <div class="grid grid-cols-12 gap-3 items-end">
        <div class="col-span-12 sm:col-span-3">
          <div class="text-xs opacity-70 mb-1">X 特征（信号）</div>
          <el-select v-model="xFeature" filterable class="w-full">
            <el-option v-for="n in featureOptions" :key="'x-'+n" :label="n" :value="n" />
          </el-select>
        </div>

        <div class="col-span-12 sm:col-span-3">
          <div class="text-xs opacity-70 mb-1">Y 特征（映射）</div>
          <el-select v-model="yFeature" filterable class="w-full">
            <el-option v-for="n in featureOptions" :key="'y-'+n" :label="n" :value="n" />
          </el-select>
        </div>

        <div class="col-span-12 sm:col-span-3">
          <div class="text-xs opacity-70 mb-1">诊断窗口（最近点）</div>
          <el-select v-model="windowSize" class="w-full">
            <el-option :value="300" label="300"/>
            <el-option :value="600" label="600"/>
            <el-option :value="1000" label="1000"/>
          </el-select>
        </div>

        <div class="col-span-12 sm:col-span-3 flex gap-2">
          <el-button type="primary" class="flex-1" :loading="running" @click="runDiagnosis">运行诊断</el-button>
          <el-button class="flex-1" @click="clearAll">清空</el-button>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="flex-1 min-h-0 mt-1 fd-tabs" type="border-card" >
      <el-tab-pane label="可视化" name="visual">
        <div class="grid grid-cols-12 gap-3 min-h-[520px]  max-h-[600px]">
          <div class="col-span-12 lg:col-span-8">
            <div class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
              <div class="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="inline-block w-1.5 h-4 rounded bg-indigo-500"></span>
                  <div class="font-medium">诊断散点图</div>
                </div>
                <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    :style="{ background: '#2563EB22', color: '#2563EB' }">Normal</span>
                  <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        :style="{ background: '#F59E0B22', color: '#F59E0B' }">Warning</span>
                  <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        :style="{ background: '#EF444422', color: '#EF4444' }">Fault</span>
                </div>
              </div>
              <div ref="chartRef" class="flex-1 min-h-[420px]"></div>
            </div>
          </div>

          <div class="col-span-12 lg:col-span-4 space-y-3">
            <!-- 彩色统计卡 -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg p-3 border border-indigo-200 dark:border-indigo-900
                      bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-neutral-900">
                <div class="text-xs opacity-70">全部点</div>
                <div class="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">{{ stat.total }}</div>
              </div>
              <div class="rounded-lg p-3 border border-emerald-200 dark:border-emerald-900
                      bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-neutral-900">
                <div class="text-xs opacity-70">高置信度(≥80%)</div>
                <div class="text-2xl font-semibold text-emerald-600 dark:text-emerald-300">{{ stat.high }}</div>
              </div>
              <div class="rounded-lg p-3 border border-sky-200 dark:border-sky-900
                      bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-neutral-900">
                <div class="text-xs opacity-70">Normal</div>
                <div class="text-2xl font-semibold text-sky-600 dark:text-sky-300">{{ stat.normal }}</div>
              </div>
              <div class="rounded-lg p-3 border border-amber-200 dark:border-amber-900
                      bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-neutral-900">
                <div class="text-xs opacity-70">Warning</div>
                <div class="text-2xl font-semibold text-amber-600 dark:text-amber-300">{{ stat.warning }}</div>
              </div>
              <div class="rounded-lg p-3 border border-rose-200 dark:border-rose-900
                      bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-neutral-900 col-span-2">
                <div class="text-xs opacity-70">Fault</div>
                <div class="text-2xl font-semibold text-rose-600 dark:text-rose-300">{{ stat.fault }}</div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 bg-white dark:bg-neutral-900">
              <div class="font-medium mb-2">结果操作</div>
              <div class="flex gap-2">
                <el-button type="success" class="flex-1" :disabled="!points.length" @click="saveResult">保存结果</el-button>
                <el-button type="info" plain class="flex-1" :disabled="!points.length" @click="exportCSV">导出 CSV</el-button>
              </div>
              <div v-if="lastRunMeta" class="mt-3 text-xs opacity-70">
                上次运行：{{ lastRunMeta.at.toLocaleString() }} · 参数（{{ lastRunMeta.xFeature }} / {{ lastRunMeta.yFeature }}）
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <!-- 替换你原来的“表格”tab 内容 -->
       <el-tab-pane label="表格" name="detail">
          <div
               class="fd-table-wrap mt-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900
               flex flex-col  min-h-[520px]  max-h-[600px] md:h-[520px]"
           >
          <div class="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 rounded bg-violet-500"></span>
              <div class="font-medium">诊断点明细</div>
            </div>
            <div class="text-xs opacity-70">已选 {{ selectedIdx.size }} 个</div>
          </div>

          <!-- ✅ 宽度占满 + 列宽可拖动（Element Plus 默认支持） -->
          <el-table
              :data="tableData"
              height="100%"
              border
              fit
              class="!bg-transparent flex-1 min-h-0 w-full"
          >
            <el-table-column label="#" width="64" align="center" fixed="left">
              <template #default="{row}">
                <el-tag size="small" :type="row._selected ? 'success' : 'info'">{{ row._i + 1 }}</el-tag>
              </template>
            </el-table-column>

            <!-- 用 min-width，让列可拉伸，同时能自适应填满剩余宽度 -->
            <el-table-column prop="timeStr" label="时间" :min-width="200" show-overflow-tooltip />
            <el-table-column label="x" prop="x" :min-width="140" show-overflow-tooltip>
              <template #default="{row}">{{ row.x?.toFixed?.(4) ?? row.x }}</template>
            </el-table-column>
            <el-table-column label="y" prop="y" :min-width="140" show-overflow-tooltip>
              <template #default="{row}">{{ row.y?.toFixed?.(4) ?? row.y }}</template>
            </el-table-column>
            <el-table-column prop="result" label="结果" :min-width="140">
              <template #default="{row}">
                <el-tag v-if="row.result==='Normal'" type="info">Normal</el-tag>
                <el-tag v-else-if="row.result==='Warning'" type="warning">Warning</el-tag>
                <el-tag v-else type="danger">Fault</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="置信度" :min-width="160">
              <template #default="{row}">
                <el-progress
                    :percentage="Math.round((row.confidence??0)*100)"
                    :stroke-width="10"
                    :status="(row.confidence??0) >= .8 ? 'success' : undefined"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
/* 细节：让 Element 卡片 & 进度条在深色下更柔和（可按需） */
:deep(.el-progress-bar__innerText){ color:#fff; }

/* 去掉 el-tabs 内容区默认 padding，消除左侧那条“内侧缝隙” */
:deep(.fd-tabs .el-tabs__content){
  padding: 0 !important;
}

/* 去掉 Element Plus Scrollbar 的补偿间距与轨道，杜绝内部竖条 */
:deep(.fd-table-wrap .el-scrollbar__wrap){
  margin-right: 0 !important;
  margin-bottom: 0 !important;
}
:deep(.fd-table-wrap .el-scrollbar__bar){
  display: none !important;
}

/* （可选）让表头背景跟随父容器，视觉更干净 */
:deep(.fd-table-wrap .el-table){
  --el-table-header-bg-color: transparent;
}

</style>