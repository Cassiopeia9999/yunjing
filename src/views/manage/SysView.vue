<script setup>
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import {useRoute, useRouter} from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { getUnitPageData } from '@/mock/unitMock'
import { ArrowRight, WarningFilled, TrendCharts, Operation } from '@element-plus/icons-vue'
import { getAssessmentUnits, getBaseList } from "@/mock/fetchDataApi.js";
import { ElMessage } from 'element-plus'
import { getLatestFeatures } from '@/mock/featureMock.js'
import FeatureConfigDialog from '@/buz/feature/FeatureConfigDialog.vue'
import { loadFeaturePanelCfg as readFeaturePanelCfg } from '@/utils/featurePanelCfg'

/** 路由 */
const route = useRoute()
const router = useRouter()

/** 基地/装置主键（统一用字符串，避免 1 与 "1" 不相等） */
const baseId  = ref(null)  // v-model 用它
const unitId  = ref(null)  // v-model 用它

/** 状态 */
const days = ref(7) // 7/30
const loading = ref(true)
const data = ref(null)
const baseList = ref([]) // 基地列表
const unitList = ref([]) // 装置列表

/** 过滤/排序/搜索 */
const keyword = ref('')
const sortKey = ref('health') // health/rul/conf/diagTime/alarm
const filters = ref({
  status: null, type: null, model: null, alarmSeverity: null
})


// 设备特征值

/** ───── 装置特征值（与设备页一致，可配置） ───── */
const featureAllUnit = ref([])              // 全量特征
const featureOrderUnit = ref([])            // 排序 key 列表
const featureDisplayCountUnit = ref(8)      // 面板显示数量
const featureDialogVisibleUnit = ref(false) // 配置对话框显隐

const makeFeatKeyUnit = f => `${f.name}|${f.source}`

async function loadUnitFeatures () {
  if (!unitId.value) { featureAllUnit.value = []; return }
  // mock：直接用现有 getLatestFeatures，传 unitId 即可
  featureAllUnit.value = await getLatestFeatures(unitId.value)

  // 每个装置独立配置：key 使用 unit-<unitId>
  const saved = readFeaturePanelCfg(`unit-${unitId.value}`)

  const validKeys = new Set(featureAllUnit.value.map(makeFeatKeyUnit))
  const savedOrder = (saved?.order || []).filter(k => validKeys.has(k))
  const newOnes = featureAllUnit.value.map(makeFeatKeyUnit).filter(k => !savedOrder.includes(k))
  featureOrderUnit.value = [...savedOrder, ...newOnes]
  featureDisplayCountUnit.value = saved?.count ?? 8
}

const featureAllSortedUnit = computed(() => {
  const map = new Map(featureAllUnit.value.map(f => [makeFeatKeyUnit(f), f]))
  const ordered = []
  featureOrderUnit.value.forEach(k => { if (map.has(k)) { ordered.push(map.get(k)); map.delete(k) } })
  return ordered.concat([...map.values()])
})
const featureCardsUnit = computed(() => featureAllSortedUnit.value.slice(0, featureDisplayCountUnit.value))

function openFeatureDialogUnit(){ featureDialogVisibleUnit.value = true }
function onFeatureApplyUnit(cfg){
  featureOrderUnit.value = cfg.order ?? []
  featureDisplayCountUnit.value = cfg.count ?? 8
}


/** 阈值与派生 */
const highProbText = computed(() => `Pθ=${data.value?.meta?.highProbThreshold ?? 70}%`)
const highProb = computed(() => data.value?.meta?.highProbThreshold ?? 70)
const unit = computed(() => data.value?.unit || {})
const kpis = computed(() => data.value?.kpis || {})
const agg  = computed(() => data.value?.aggregates || {})
const rawDevices = computed(() => data.value?.devices || [])
const statusOptions = computed(()=> data.value?.enums?.status || [])
const typeOptions   = computed(()=> data.value?.enums?.types || [])
const modelOptions  = computed(()=> data.value?.enums?.models || [])
const alarmLevelOptions = computed(()=> data.value?.enums?.alarmLevels || [])
/** 装置状态映射（兼容字符串/数字/中英混用） */
const UNIT_STATUS_MAP = {
  // 数字编码（若后端用数字）
  '1': { label: '正常', type: 'success' },
  '2': { label: '预警', type: 'warning' },
  '3': { label: '故障', type: 'danger'  },
  '4': { label: '停用', type: 'info'    },

  // 英文态（如果是字符串）
  normal:   { label: '正常', type: 'success' },
  warning:  { label: '预警', type: 'warning' },
  fault:    { label: '故障', type: 'danger'  },
  stopped:  { label: '停用', type: 'info'    },
  stop:     { label: '停用', type: 'info'    },

  // 中文直给
  '正常':   { label: '正常', type: 'success' },
  '预警':    { label: '预警', type: 'warning' },
  '故障':    { label: '故障', type: 'danger'  },
  '停用':    { label: '停用', type: 'info'    },
};

const unitStatusInfo = computed(() => {
  const raw = unit.value?.system_status ?? unit.value?.status ?? '';
  const key1 = String(raw).trim();
  const key2 = key1.toLowerCase();
  return UNIT_STATUS_MAP[key1] || UNIT_STATUS_MAP[key2] || UNIT_STATUS_MAP[String(Number(key1))] || { label: '未知', type: 'info' };
});

/** 评价时间兜底（兼容字段名差异） */
const unitAssessTime = computed(() => {
  const u = unit.value || {};
  return u.evaluate_time || u.assess_time || u.assessTime || u.time || '';
});

/** 列表计算 */
const devices = computed(() => {
  let list = [...rawDevices.value]
  if (keyword.value?.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(r =>
        (r.device_name||'').toLowerCase().includes(kw) ||
        (r.component_code||'').toLowerCase().includes(kw) ||
        (r.component_model||'').toLowerCase().includes(kw)
    )
  }
  if (filters.value.status) list = list.filter(r => r.status === filters.value.status)
  if (filters.value.type) list = list.filter(r => r.component_type === filters.value.type)
  if (filters.value.model) list = list.filter(r => r.component_model === filters.value.model)
  if (filters.value.alarmSeverity) list = list.filter(r => r.alarm?.severity === filters.value.alarmSeverity)

  switch (sortKey.value) {
    case 'health':   list.sort((a,b)=>(b.health_level??0)-(a.health_level??0)); break
    case 'rul':      list.sort((a,b)=>(b.remaining_life??0)-(a.remaining_life??0)); break
    case 'conf':     list.sort((a,b)=>(b.confidence_level??0)-(a.confidence_level??0)); break
    case 'diagTime': list.sort((a,b)=>new Date(b.diag?.diagnosis_time||0)-new Date(a.diag?.diagnosis_time||0)); break
    case 'alarm':    list.sort((a,b)=>(b.alarm?.severityLevel??0)-(a.alarm?.severityLevel??0)); break
  }
  return list
})

/** 业务入口/事件 */
const selection = ref([])
function onSelectionChange(rows){ selection.value = rows || [] }
function openDevice(row) {
  // 设备 id 兜底兼容不同字段名
  const did = String(row?.id ?? row?.device_id ?? '')
  const bid = String(baseId.value ?? '')
  const uid = String(unitId.value ?? '')

  if (!did || !uid) {
    console.error('[openDevice] 缺少必要参数', { did, uid, bid, row })
    ElMessage.error('无法跳转：缺少设备或装置ID')
    return
  }

  // 跳转到设备详情
  router.push({
    name: 'ManageDevView',
    params: { baseId: bid, unitId: uid, deviceId: did }
  }).catch(() => {})
}
function openDiagnosisDetail(row){ if(row?.diag) console.log('→ 诊断详情', row.diag) }
function openAlarmDetail(row){ if(row?.alarm) console.log('→ 告警详情', row.alarm) }

/** 图表 */
const elDiagDist = ref(null)
const elAlarmDist = ref(null)
const elTrend = ref(null)
let ecDiag, ecAlarm, ecTrend

function disposeCharts() {
  if (ecDiag) { ecDiag.dispose(); ecDiag = null }
  if (ecAlarm){ ecAlarm.dispose(); ecAlarm = null }
  if (ecTrend){ ecTrend.dispose(); ecTrend = null }
}
function renderCharts(){
  disposeCharts()

  // 1) 主题适配（如果你有全局 isDark，就替换这行）
  const isDark = document.documentElement.classList.contains('dark')

  // 2) 颜色/样式基准
  const labelColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--chart-label-color') || '#A3A3A3'
  const subText    = isDark ? '#A3A3A3' : '#6B7280'     // 引导线/坐标轴文字
  const axisLine   = isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)'
  const splitLine  = isDark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.08)'
  const tipBg      = isDark ? 'rgba(17,24,39,.95)' : 'rgba(255,255,255,.98)'
  const tipText    = isDark ? '#F3F4F6' : '#111827'

  // 3) 通用 label 样式：四个状态统一，避免被 ECharts 默认状态覆盖
  const labelBase = {
    show: true,
    color: labelColor,
    fontSize: 16,
    fontWeight: 'normal',
    opacity: 1,
    textBorderColor: 'transparent',
    textBorderWidth: 0
  }
  const emphLabel = { ...labelBase }
  const blurLabel = { ...labelBase }
  const selLabel  = { ...labelBase }
  const labelLineBase = { lineStyle: { color: subText, opacity: 0.9, width: 1 } }

  // =============== 故障知识分布（玫瑰图） ===============
  if (elDiagDist.value) {
    ecDiag = echarts.init(elDiagDist.value)
    const s = data.value?.charts?.diagDist || []

    ecDiag.setOption({
      textStyle: { color: labelColor }, // 全局兜底，防主题反色
      tooltip: { trigger: 'item', backgroundColor: tipBg, textStyle: { color: tipText } },
      series: [{
        type: 'pie',
        roseType: 'area',
        radius: ['20%', '70%'],
        avoidLabelOverlap: false,
        data: s.map(d => ({ name: `${d.name} (${d.highShare}%)`, value: d.value })),
        label: labelBase,
        labelLine: labelLineBase,
        emphasis: { focus: 'none', label: emphLabel }, // 关闭下沉效果
        blur:     { label: blurLabel },
        select:   { label: selLabel }
      }]
    })

    ecDiag.on('click', p => { if (p?.name) { keyword.value = p.name.split(' (')[0] } })
  }

  // =============== 告警等级占比（饼图） ===============
  if (elAlarmDist.value) {
    ecAlarm = echarts.init(elAlarmDist.value)
    const s = data.value?.charts?.alarmDist || []

    ecAlarm.setOption({
      textStyle: { color: labelColor },
      tooltip: { trigger: 'item', backgroundColor: tipBg, textStyle: { color: tipText } },
      series: [{
        type: 'pie',
        radius: '70%',
        avoidLabelOverlap: false,
        data: s.map(d => ({ name: d.level, value: d.count })),
        label: labelBase,
        labelLine: labelLineBase,
        emphasis: { focus: 'none', label: emphLabel },
        blur:     { label: blurLabel },
        select:   { label: selLabel }
      }]
    })

    ecAlarm.on('click', p => { filters.value.alarmSeverity = p?.name || null })
  }

  // =============== 诊断趋势（折线图） ===============
  if (elTrend.value) {
    ecTrend = echarts.init(elTrend.value)
    const s = data.value?.charts?.diagTrend || { dates: [], counts: [] }

    ecTrend.setOption({
      textStyle: { color: labelColor },
      tooltip: { trigger: 'axis', backgroundColor: tipBg, textStyle: { color: tipText } },
      grid: { left: 36, right: 16, top: 24, bottom: 28 },
      xAxis: {
        type: 'category',
        data: s.dates,
        axisLabel: { color: subText },
        axisLine: { lineStyle: { color: axisLine } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: subText },
        splitLine: { lineStyle: { color: splitLine } },
        axisLine: { lineStyle: { color: axisLine } },
        axisTick: { show: false }
      },
      series: [{
        type: 'line',
        smooth: true,
        data: s.counts,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { width: 2 },
        label: { position: 'top', ...labelBase },
        emphasis: { focus: 'none', label: emphLabel },
        blur:     { label: blurLabel },
        select:   { label: selLabel }
      }]
    })
  }
}


onBeforeUnmount(disposeCharts)

/** 加载装置数据（依赖 unitId/baseId） */
async function load() {
  if (!unitId.value) return
  loading.value = true
  data.value = await getUnitPageData(unitId.value, {
    baseId: baseId.value,
    days: days.value,
    highProbThreshold: highProb.value
  })

  // ★ 加载装置特征（与设备页一致的卡片数据）
  await loadUnitFeatures()

  loading.value = false
  await nextTick()
  renderCharts()
}

/** 加载选中基地下的装置列表 */
async function loadUnits() {
  if (!baseId.value) return
  unitList.value = await getAssessmentUnits(baseId.value)

  if (!unitList.value.length) {
    unitId.value = null
    ElMessage.error('当前基地没有装置，无法加载装置数据')
    return
  }

  // 如果当前 unitId 不属于新列表，则默认选第一个
  const stillExists = unitList.value.some(u => String(u.id) === String(unitId.value))
  if (!stillExists) unitId.value = String(unitList.value[0].id)

  await load()
}

/** 加载基地列表（并根据路由/默认值设置 baseId & unitId） */
async function loadBaseList() {
  baseList.value = await getBaseList()

  // 若路由未提供 baseId，用第一个；有就用路由的
  if (!baseId.value) {
    baseId.value = baseList.value?.[0] ? String(baseList.value[0].id) : null
  }
  await loadUnits()
}

/** 路由参数 → 本页选中值（初次/变化时都同步） */
watch(() => route.params.baseId, (v) => {
  if (v != null) baseId.value = String(v)
}, { immediate: true })

watch(() => route.params.unitId, (v) => {
  if (v != null) unitId.value = String(v)
}, { immediate: true })

/** 用户手动切换 baseId 时，刷新装置列表 */
watch(baseId, async (newVal, oldVal) => {
  if (newVal !== oldVal) await loadUnits()
})

/** days 切换直接重载 */
watch(days, () => load())

onMounted(() => {
  loadBaseList()
})

/** 下面弹窗/抽屉开关 & 事件（占位保持你原逻辑） */
const drawerAlarm = ref(false)
const dialogBatchDiag = ref(false)
const dialogBatchForecast = ref(false)
const dialogDecision = ref(false)
function openBatchDiagnose(){ dialogBatchDiag.value = true }
function openBatchForecast(){ dialogBatchForecast.value = true }
function openAlarmCenter(){ drawerAlarm.value = true }
function openDecision(){ dialogDecision.value = true }
</script>



<template>
  <!-- 顶层固定布局：头部固定 + 内容滚动 -->
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
    <!-- 头部（固定区域，不滚动） -->
    <div class="p-4 lg:p-6 border-b border-neutral-200 dark:border-neutral-700">
      <!-- 第一行：左(装置名+状态牌+评价时间) | 右(KPI三块) -->
      <div class="grid grid-cols-12 gap-4 items-start">
        <!-- 左：大标题 + 状态牌 + 评价时间 -->
        <div class="col-span-7 min-w-0">
          <div class="flex items-center gap-12">
            <!-- 装置名（超大） -->
            <h1 class="device-title truncate" :title="unit.system_name">
              {{ unit.system_name || '—' }}
            </h1>

            <!-- 状态牌 + 评价时间（纵向居中） -->
            <div class="flex flex-col items-center">
              <!-- 状态牌 -->
              <div class="status-board" :class="'sb-' + unitStatusInfo.type">
                <span class="sb-text">{{ unitStatusInfo.label }}</span>
              </div>

              <!-- 评价时间 -->
              <div class="mt-1 text-[14px] opacity-80 text-center">
                评价时间 :
                <span class="font-medium">
                    {{
                                  unitAssessTime
                                      ? unitAssessTime.replace('T',' ').slice(0,19)
                                      : '—'
                                }}
                  </span>
              </div>
            </div>

          </div>
        </div>

        <!-- 右：三块 KPI（与设备页风格一致） -->
        <div class="col-span-5">
          <div class="grid grid-cols-3 gap-3">
            <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
              <div class="kpi-label">装置级 RUL</div>
              <div class="kpi-value text-indigo-500 dark:text-indigo-300">
                {{ unit.remaining_life ?? '—' }}<span class="kpi-unit">天</span>
              </div>
            </el-card>

            <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
              <div class="kpi-label">置信度</div>
              <div class="kpi-value text-emerald-500 dark:text-emerald-300">
                {{ unit.confidence_level ?? '—' }}<span class="kpi-unit">%</span>
              </div>
            </el-card>

            <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
              <div class="kpi-label">诊断次数（{{ days }}天）</div>
              <div class="kpi-value">
                {{ kpis.diagCount ?? 0 }}
              </div>
            </el-card>
          </div>
        </div>
      </div>

      <!-- 第二行：选择器 -->
      <div class="mt-3 flex items-center gap-1">
        <el-select v-model="baseId" style="width:150px" placeholder="选择基地" @change="load">
          <el-option v-for="b in baseList" :key="b.id" :label="b.name" :value="String(b.id)" />
        </el-select>
        <el-select v-model="unitId" style="width:250px" placeholder="选择装置" @change="load">
          <el-option v-for="u in unitList" :key="u.id" :label="u.name" :value="String(u.id)" />
        </el-select>
      </div>

      <!-- 第三行：装置信息 Tag（有色） -->
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <el-tag type="primary" effect="plain" size="default"   :title="unit.system_type">类型：{{ unit.system_type || '—' }}</el-tag>
        <el-tag type="primary" effect="plain" size="default" :title="unit.system_code">编码：{{ unit.system_code || '—' }}</el-tag>
        <el-tag type="primary" effect="plain" size="default" :title="unit.system_model">型号：{{ unit.system_model || '—' }}</el-tag>
        <el-tag type="primary" effect="plain" size="default" :title="unit.manufacturer">厂家：{{ unit.manufacturer || '—' }}</el-tag>
        <el-tag type="primary"  effect="plain" size="default" :title="unit.install_date">安装：{{ unit.install_date || '—' }}</el-tag>
      </div>
    </div>


    <!-- 内容（滚动区域）：只这一块会滚动 -->
    <div class="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
      <el-skeleton :loading="loading" animated>
        <template #template>
          <el-skeleton-item variant="rect" style="height:420px" />
        </template>

        <!-- 主体两栏 -->
        <div class="grid grid-cols-12 gap-4 min-h-0">
        <!-- 左：设备列表 -->
          <el-card class="col-span-8 min-w-0 dark:bg-neutral-800" shadow="never" body-style="padding:0">
            <div class="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div class="font-medium">设备列表</div>

              <!-- 右侧工具条：允许换行 + 控件不收缩 -->
              <div class="flex items-center gap-3 flex-wrap justify-end">
                <el-input
                    v-model="keyword"
                    size="small"
                    placeholder="搜索设备/编码/型号"
                    clearable
                    style="width:180px"
                    class="shrink-0"
                />

                <el-select v-model="filters.status" size="small" placeholder="状态" clearable
                           style="width:102px" class="shrink-0">
                  <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
                </el-select>

                <el-select v-model="filters.type" size="small" placeholder="类型" clearable
                           style="width:108px" class="shrink-0">
                  <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
                </el-select>

                <el-select v-model="filters.model" size="small" placeholder="型号" clearable
                           style="width:120px" class="shrink-0">
                  <el-option v-for="m in modelOptions" :key="m" :label="m" :value="m" />
                </el-select>

                <el-select v-model="filters.alarmSeverity" size="small" placeholder="告警等级" clearable
                           style="width:118px" class="shrink-0">
                  <el-option v-for="lv in alarmLevelOptions" :key="lv" :label="lv" :value="lv" />
                </el-select>

                <span class="text-xs opacity-70 shrink-0">排序</span>

                <!-- 排序下拉：给足宽度 + 禁止收缩 -->
                <el-select v-model="sortKey" size="small" style="width:120px" class="shrink-0">
                  <el-option label="健康度" value="health"/>
                  <el-option label="RUL" value="rul"/>
                  <el-option label="置信度" value="conf"/>
                  <el-option label="最近诊断" value="diagTime"/>
                  <el-option label="告警等级" value="alarm"/>
                </el-select>
              </div>
            </div>


            <!-- 这里不限制高度，让外层内容容器滚动即可 -->
            <div>
              <el-table
                  :data="devices"
                  size="small"
                  class="!bg-transparent"
                  :row-class-name="()=>'cursor-pointer'"
                  @row-dblclick="openDevice"
                  @selection-change="onSelectionChange"
                  :row-key="row=>row.id"
              >
                <el-table-column type="selection" width="40"/>
                <el-table-column label="设备" min-width="180">
                  <template #default="{row}">
                    <div class="flex items-center gap-2">
                      <div class="font-medium truncate" :title="row.device_name">{{ row.device_name }}
                      <el-link type="primary" :underline="false" class="ml-1"
                                 @click.stop="openDevice(row)">详情</el-link>
                      </div>
                      <el-tag size="small" :type="(row.status==='Fault'?'danger':row.status==='Warning'?'warning':'success')">
                        {{ row.status }}
                      </el-tag>
                    </div>
                    <div class="text-[12px] opacity-70 truncate" :title="row.component_code">
                      {{ row.component_type.name }}  · {{ row.component_code }}
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="健康度" width="88">
                  <template #default="{row}">{{ row.health_level ?? '—' }}</template>
                </el-table-column>
                <el-table-column label="RUL(天)" width="96" prop="remaining_life"/>
                <el-table-column label="Conf(%)" width="92" prop="confidence_level"/>

                <el-table-column label="最近诊断" min-width="220">
                  <template #default="{row}">
                    <div class="flex items-center gap-2">
                      <el-tag v-if="row?.diag?.probability != null"
                              :type="row.diag.probability >= highProb ? 'danger':'info'"
                              size="small">{{ Math.round(row.diag.probability) }}%</el-tag>
                      <span class="truncate" :title="row.diag?.fault_knowledge_name || '—'">
                        {{ row.diag?.fault_knowledge_name || '—' }}
                      </span>
                      <el-button link type="primary" size="small" @click.stop="openDiagnosisDetail(row)">详情</el-button>
                    </div>
                    <div class="text-[12px] opacity-70">
                      {{ row.diag?.diagnosis_time ? row.diag.diagnosis_time.replace('T',' ').slice(0,19) : '—' }}
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="最新告警" min-width="200">
                  <template #default="{row}">
                    <div class="flex items-center gap-2">
                      <el-icon v-if="row.alarm" class="shrink-0"><WarningFilled/></el-icon>
                      <el-tag v-if="row?.alarm?.severity" size="small">{{ row.alarm.severity }}</el-tag>
                      <span class="truncate" :title="row.alarm?.type || '—'">{{ row.alarm?.type || '—' }}</span>
                      <el-button v-if="row.alarm" link type="primary" size="small" @click.stop="openAlarmDetail(row)">处置</el-button>
                    </div>
                    <div class="text-[12px] opacity-70">
                      {{ row.alarm?.time ? row.alarm.time.replace('T',' ').slice(0,19) : '—' }}
                    </div>
                  </template>
                </el-table-column>

                <el-table-column align="center" width="44" label="详情">
                  <template #default="{ row }">
                    <el-link type="primary" :underline="false" @click.stop="openDevice(row)">
                      <el-icon><ArrowRight /></el-icon>
                    </el-link>
                  </template>
                </el-table-column>

              </el-table>
            </div>
          </el-card>

          <!-- 右：分析图表 -->
          <div class="col-span-4 min-w-0 flex flex-col gap-3">

            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">装置特征值</div>
                <el-button size="small" type="primary" link @click="openFeatureDialogUnit">更多</el-button>
              </div>

              <div class="feat-grid">
                <div v-for="f in featureCardsUnit" :key="makeFeatKeyUnit(f)" class="feat-card">
                  <div class="feat-name" :title="f.name">{{ f.name }}</div>
                  <div class="feat-val">
                    <span class="feat-num">{{ f.value }}</span>
                    <span class="feat-unit">{{ f.unit }}</span>
                  </div>
                  <div class="feat-time">{{ f.ts?.replace('T',' ').slice(0,19) || '—' }}</div>
                  <el-tag size="small" :type="f.source==='parsed' ? 'success' : 'info'">
                    {{ f.source==='parsed' ? '解析' : '上报' }}
                  </el-tag>
                </div>
              </div>
              <div v-if="!featureCardsUnit.length" class="text-xs opacity-70">暂无特征</div>
            </el-card>


<!--            <el-card shadow="never" class="dark:bg-neutral-800">-->
<!--              <div class="flex items-center justify-between mb-2">-->
<!--                <div class="font-medium">故障知识分布</div>-->
<!--                <el-tag size="small" effect="plain">点击联动列表</el-tag>-->
<!--              </div>-->
<!--              <div ref="elDiagDist" class="h-[220px]"></div>-->
<!--            </el-card>-->

            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">告警等级占比</div>
                <el-tag size="small" effect="plain">点击筛选告警</el-tag>
              </div>
              <div ref="elAlarmDist" class="h-[220px]"></div>
            </el-card>

            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">诊断趋势（{{days}}天）</div>
              </div>
              <div ref="elTrend" class="h-[220px]"></div>
            </el-card>
          </div>
        </div>

        <!-- 快捷入口 -->


        <!-- 在制故障 -->
        <el-card class="mt-3 dark:bg-neutral-800" shadow="never" v-if="(data?.faults?.length||0)>0">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">在制故障</div>
            <el-tag size="small" effect="plain">SLA 跟踪</el-tag>
          </div>
          <el-table :data="data?.faults" size="small" class="!bg-transparent">
            <el-table-column prop="code" label="故障编码" width="140"/>
            <el-table-column prop="status" label="状态" width="100"/>
            <el-table-column prop="owner" label="负责人" width="120"/>
            <el-table-column label="SLA 截止" width="160">
              <template #default="{row}">{{ row.sla_deadline?.replace('T',' ').slice(0,19) || '—' }}</template>
            </el-table-column>
            <el-table-column prop="summary" label="摘要" min-width="240" show-overflow-tooltip/>
          </el-table>
        </el-card>

        <!-- 抽屉/对话框 -->
        <el-drawer v-model="drawerAlarm" title="装置告警中心" size="60%">
          <div class="mb-3 text-sm opacity-70">聚焦当前装置未结告警，支持确认/升级为故障/忽略</div>
          <el-table :data="data?.alarmCenter || []" size="small">
            <el-table-column prop="device_name" label="设备" width="160"/>
            <el-table-column prop="type" label="告警类型" width="160"/>
            <el-table-column prop="severity" label="等级" width="100"/>
            <el-table-column label="时间" width="180">
              <template #default="{row}">{{ row.time?.replace('T',' ').slice(0,19) || '—' }}</template>
            </el-table-column>
            <el-table-column prop="desc" label="描述" min-width="240" show-overflow-tooltip/>
            <el-table-column label="操作" width="220">
              <template #default="{row}">
                <el-button size="small" type="primary">确认</el-button>
                <el-button size="small" type="warning">升级为故障</el-button>
                <el-button size="small" type="info" plain>忽略</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-drawer>

        <el-dialog v-model="dialogBatchDiag" title="批量诊断" width="520px">
          <div class="text-sm mb-3">将对已选择的 {{ selection.length }} 台设备发起诊断任务。</div>
          <el-input type="textarea" rows="3" placeholder="可选：任务备注…" />
          <template #footer>
            <el-button @click="dialogBatchDiag=false">取消</el-button>
            <el-button type="primary" @click="dialogBatchDiag=false">提交</el-button>
          </template>
        </el-dialog>

        <el-dialog v-model="dialogBatchForecast" title="批量趋势预测" width="520px">
          <div class="text-sm mb-3">将对已选择的 {{ selection.length }} 台设备发起 RUL/健康趋势预测。</div>
          <el-select size="small" class="w-40" placeholder="预测窗口">
            <el-option label="7天" value="7"/>
            <el-option label="30天" value="30"/>
            <el-option label="90天" value="90"/>
          </el-select>
          <template #footer>
            <el-button @click="dialogBatchForecast=false">取消</el-button>
            <el-button type="primary" @click="dialogBatchForecast=false">提交</el-button>
          </template>
        </el-dialog>

        <el-dialog v-model="dialogDecision" title="维修决策" width="720px">
          <div class="text-sm mb-3 opacity-80">将装置 KPI（诊断/告警/健康聚合）作为上下文，进入维修计划编制。</div>
          <el-form label-width="110px">
            <el-form-item label="优先级"><el-select class="w-40" placeholder="选择"><el-option label="高" value="H"/><el-option label="中" value="M"/><el-option label="低" value="L"/></el-select></el-form-item>
            <el-form-item label="计划窗口"><el-date-picker type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束"/></el-form-item>
            <el-form-item label="说明"><el-input type="textarea" rows="3" placeholder="处置思路、备件、停机影响等"/></el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="dialogDecision=false">取消</el-button>
            <el-button type="success" @click="dialogDecision=false">生成决策草案</el-button>
          </template>
        </el-dialog>


        <FeatureConfigDialog
            v-model:visible="featureDialogVisibleUnit"
            :device-id="`unit-${unitId}`"
            :features="featureAllUnit"
            :default-count="featureDisplayCountUnit"
            :makeKey="makeFeatKeyUnit"
            :maxCount="24"
            @apply="onFeatureApplyUnit"
        />

      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
/* 与 Base 页一致的信息密度 */
:deep(.el-card__body){ padding: 12px; }


.status-board {
  min-width: 160px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.15);
}

.sb-text {
  font-size: 34px;
  font-weight: 600;
  letter-spacing: 2px;
}

/* 不同状态的颜色方案 */
.sb-success{ background: #08af15; color: #f6f2f6; }  /* 正常：深绿底、荧绿字 */
.sb-warning{ background: #ef9907; color: #f6f2f6; }  /* 预警 */
.sb-danger { background: #7a0a0a; color: #ffb3b3; }  /* 故障 */
.sb-info   { background: #3a3a3a; color: #dcdcdc; }  /* 停用/未知 */
/* 大标题：和截图同级的“视觉分量” */
.device-title{
  font-size: clamp(32px, 6vw, 52px); /* 1号主泵 的量级 */
  font-weight: 700;
  line-height: 1;
  letter-spacing: .5px;
  white-space: nowrap;
}
:root {
  --chart-label-color: #111827; /* 深黑 */
}
.dark {
  --chart-label-color: #E5E7EB; /* 灰白 */
}


/* 特征小卡片网格，与设备页一致 */
.feat-grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.feat-card{
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 6px;
  padding: 5px 6px;
  background: rgba(0,0,0,.02);
  display: grid;
  grid-template-rows: auto auto auto auto;
  row-gap: 6px;
}
.dark .feat-card{
  border-color: rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
}
.feat-name{ font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.feat-val{ display: flex; align-items: baseline; gap: 6px; }
.feat-num{ font-size: 22px; font-weight: 800; line-height: 1; }
.feat-unit{ font-size: 12px; opacity: .75; }
.feat-time{ font-size: 12px; opacity: .7; }

</style>
