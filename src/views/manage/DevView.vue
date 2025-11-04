<script setup>
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount, reactive } from 'vue'
import * as echarts from 'echarts'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, WarningFilled, CircleCheck, Upload, Document } from '@element-plus/icons-vue'

import ThemeToggle from '@/components/ThemeToggle.vue'
import FaultDiagnosisPanel from '@/components/alg/FaultDiagnosisPanel.vue'

import { getDevicePageData } from '@/mock/deviceMock'
import { fetchDevices, getBaseList, getAssessmentUnits } from '@/mock/fetchDataApi'
import { getLatestFeatures } from '@/mock/featureMock.js'
import FeatureConfigDialog from "@/buz/feature/FeatureConfigDialog.vue";
import { loadFeaturePanelCfg as readFeaturePanelCfg } from '@/utils/featurePanelCfg'
import DeviceStatusAssessment from "@/components/alg/DeviceStatusAssessment.vue";

/** 新增：特征配置对话框（独立组件） */

const route = useRoute()
const router = useRouter()

/** 统一使用“字符串 id”，避免 1 vs "1" 不相等 **/
const baseId   = ref(null)
const unitId   = ref(null)
const deviceId = ref(null)

/** 首次 & 变化：从路由同步三参（若存在） */
watch(() => route.params.baseId,   v => { if (v != null) baseId.value   = String(v) }, { immediate: true })
watch(() => route.params.unitId,   v => { if (v != null) unitId.value   = String(v) }, { immediate: true })
watch(() => route.params.deviceId, v => { if (v != null) deviceId.value = String(v) }, { immediate: true })

/** 其他状态 */
const days = ref(365)
const loading = ref(true)
const data = ref(null)
const dialogFaultDiag = ref(false)

/** 列表数据 */
const baseList = ref([])
const unitList = ref([])
const deviceList = ref([])

/** 顶部派生 */
const dev = computed(() => data.value?.device || {})
const parents = computed(() => data.value?.parents || {})
const highProbText = computed(() => `Pθ=${data.value?.meta?.highProbThreshold ?? 70}%`)
const snap = computed(() => data.value?.snapshot || null)

/** 记录/筛选 */
const recordsRaw = computed(() => data.value?.records || [])
const selectedRows = ref([])
const keyword = ref('')
const onlyHigh = ref(false)



// 按“同一时间点(到秒)”分组，产出父表数据
const recordGroups = computed(() => {
  const list = records.value || []
  const map = new Map()
  for (const r of list) {
    const key = fmtDT(r.diagnose_time)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(r)
  }
  const rows = []
  for (const [time, arr] of map.entries()) {
    const names = arr.map(a => a.fault_name || '—')
    // 可能的文件字段：raw_file_name / raw_file_id / file_name / raw_file
    const files = Array.from(
        new Set(arr.map(a => a.raw_file_name || a.raw_file_id || a.file_name || a.raw_file).filter(Boolean))
    )
    rows.push({
      id: time,                   // 父行 id
      time,                       // 时间（到秒）
      namesText: names.join('，'),
      filesText: files.join('，'),
      count: arr.length,
      children: arr               // 展开表用原始行
    })
  }
  // 倒序（新到旧）
  rows.sort((a,b) => b.time.localeCompare(a.time))
  return rows
})


const records = computed(() => {
  let list = [...recordsRaw.value]
  if (keyword.value?.trim()) {
    const k = keyword.value.trim().toLowerCase()
    list = list.filter(r =>
        (r.fault_name || '').toLowerCase().includes(k) ||
        (r.description || '').toLowerCase().includes(k)
    )
  }
  if (onlyHigh.value) {
    const th = data.value?.meta?.highProbThreshold ?? 70
    list = list.filter(r => (r.probability ?? 0) >= th)
  }
  return list
})


// 控制评估组件弹窗显隐（可选，也可完全依赖组件内部状态）
const showAssessment = ref(false)

// 处理评估完成回调（可选，接收组件返回的评估结果）
function handleAssessmentComplete(result) {
  console.log('设备状态评估完成，结果：', result)
  // 可在此处更新页面KPI数据（如健康度、置信度）
  ElMessage.success('设备状态评估成功完成')
}

// 处理评估错误回调（可选）
function handleAssessmentError(error) {
  console.error('设备状态评估失败：', error)
  ElMessage.error(`评估失败：${error.message || '未知错误'}`)
}

/** 规则提示/QA */
const tips = computed(() => data.value?.riskTips || [])
const qa = computed(() => data.value?.qa || { passed: true, block: false, msg: '' })
const actionsDisabled = computed(() => qa.value?.block === true)

/** 设备图片 */
const devImages = computed(() => dev.value?.dev_image ?? [])
const hasMultiImages = computed(() => devImages.value.length > 1)

/** 概率趋势图 */
const elProb = ref(null)
let ecProb = null
function disposeCharts(){ if (ecProb){ ecProb.dispose(); ecProb = null } }
function renderCharts(){
  disposeCharts()
  if (!elProb.value) return
  ecProb = echarts.init(elProb.value)
  const s = data.value?.charts?.probTrend || { dates: [], probs: [] }
  ecProb.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: s.dates },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{ type: 'line', smooth: true, data: s.probs }]
  })
}
onBeforeUnmount(disposeCharts)

function goUnitDetail() {
  router.push({
    name: 'ManageSysView',
    params: { baseId: String(baseId.value), unitId: String(unitId.value) }
  })
}
// 每个分组一份勾选集：{ [groupId]: Row[] }
const groupSelections = reactive({})

// 子表 selection-change 回调：汇总到 selectedRows
function onSubSelChange(groupRow, rows) {
  groupSelections[groupRow.id] = rows || []
  const all = Object.values(groupSelections).flat()
  selectedRows.value = all
}


const fmtDT = (s) => (s || '').replace('T',' ').slice(0,19)

/** 状态盘映射 */
const STATUS_MAP = {
  '1': { label: '正常', type: 'success' },
  '2': { label: '预警', type: 'warning' },
  '3': { label: '故障', type: 'danger' },
  '4': { label: '停用', type: 'info' },
  default: { label: '未知', type: 'info' }
}
const statusInfo = computed(() => {
  const key = String(dev.value?.status ?? '')
  return STATUS_MAP[key] || STATUS_MAP.default
})

/** ────────── 数据加载链路 ────────── */
async function ensureBase(){
  baseList.value = await getBaseList()
  if (!baseList.value.length){
    baseId.value = null; unitList.value = []; deviceList.value = []
    ElMessage.warning('暂无基地数据'); return false
  }
  const exists = baseList.value.some(b => String(b.id) === String(baseId.value))
  if (!exists) baseId.value = String(baseList.value[0].id)
  return true
}
async function ensureUnit(){
  if (!baseId.value) return false
  unitList.value = await getAssessmentUnits(baseId.value)
  if (!unitList.value.length){
    unitId.value = null; deviceList.value = []
    ElMessage.error('当前基地没有装置'); return false
  }
  const exists = unitList.value.some(u => String(u.id) === String(unitId.value))
  if (!exists) unitId.value = String(unitList.value[0].id)
  return true
}
async function ensureDevice(){
  if (!baseId.value || !unitId.value) return false
  deviceList.value = await fetchDevices(baseId.value, [unitId.value])
  if (!deviceList.value.length){
    deviceId.value = null
    ElMessage.error('当前装置下没有设备'); return false
  }
  const exists = deviceList.value.some(d => String(d.id) === String(deviceId.value))
  if (!exists) deviceId.value = String(deviceList.value[0].id)
  return true
}
async function loadDeviceDetails(){
  if (!deviceId.value) return
  loading.value = true
  data.value = await getDevicePageData(deviceId.value, { days: days.value })

  // ★ 加载最新特征（mock）并对齐配置（由对话框导出的工具读取本地配置）
  await loadFeatures()

  loading.value = false
  await nextTick(); renderCharts()
}

const assessTime = computed(() => {
  const m = data.value?.meta || {}
  return m.assessTime || m.assess_time || m.evaluate_time || dev.value?.evaluate_time || ''
})

async function loadAll(){
  loading.value = true
  const okBase   = await ensureBase();   if (!okBase) { loading.value = false; return }
  const okUnit   = await ensureUnit();   if (!okUnit) { loading.value = false; return }
  const okDevice = await ensureDevice(); if (!okDevice){ loading.value = false; return }
  await loadDeviceDetails()
}
async function onBaseChange(){
  unitId.value = null; deviceId.value = null
  const okUnit = await ensureUnit(); if (!okUnit) return
  const okDev  = await ensureDevice(); if (!okDev) return
  await loadDeviceDetails()
}
async function onUnitChange(){
  deviceId.value = null
  const okDev = await ensureDevice(); if (!okDev) return
  await loadDeviceDetails()
}
async function onDeviceChange(){ await loadDeviceDetails() }

/** 其它交互 */
function onSelChange(rows){ selectedRows.value = rows || [] }
function markConfirmed(row){ row.confirmed = true }
const drawerBasis = ref({ visible:false, record:null })
const drawerRaw   = ref({ visible:false, record:null })
const dialogForecast = ref(false)
const dialogNewFault = ref(false)
const dialogUpgrade  = ref({ visible:false, record:null })
function upgradeToFault(row){ dialogUpgrade.value = { visible:true, record:row } }
function viewBasis(row){ drawerBasis.value = { visible:true, record:row } }
function viewRaw(row){   drawerRaw.value   = { visible:true, record:row } }
function exportSelected(){
  const rows = selectedRows.value; if (!rows.length) return
  const header = ['diagnosis_time','fault_name','probability','description']
  const csv = [header.join(',')].concat(
      rows.map(r => [r.diagnosis_time, `"${r.fault_name}"`, r.probability, `"${r.description||''}"`].join(','))
  ).join('\n')
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `diagnosis_${dev.value.component_code || deviceId.value}.csv`; a.click()
  URL.revokeObjectURL(url)
}
function goDiagnose(){ if(!actionsDisabled.value){ /* TODO */ } }
function goForecast(){ if(!actionsDisabled.value){ dialogForecast.value = true } }
function newOrLinkFault(){ dialogNewFault.value = true }

/** ───── 最新特征值（小卡片/对话框配置） ───── */
const featureAll = ref([])                 // 全量特征
const featureOrder = ref([])               // 排序 key 列表
const featureDisplayCount = ref(8)         // 面板显示数量
const featureDialogVisible = ref(false)    // 对话框显隐

const makeFeatKey = f => `${f.name}|${f.source}`

async function loadFeatures(){
  featureAll.value = await getLatestFeatures(deviceId.value)

  // 读取已保存面板配置（来自对话框组件的工具函数）
  const saved = readFeaturePanelCfg(deviceId.value)

  // 有效键集合
  const validKeys = new Set(featureAll.value.map(makeFeatKey))

  // 已保存排序
  const savedOrder = (saved?.order || []).filter(k => validKeys.has(k))
  // 末尾追加新出现的key
  const newOnes = featureAll.value.map(makeFeatKey).filter(k => !savedOrder.includes(k))
  featureOrder.value = [...savedOrder, ...newOnes]

  featureDisplayCount.value = saved?.count ?? 8
}

const featureAllSorted = computed(() => {
  const map = new Map(featureAll.value.map(f => [makeFeatKey(f), f]))
  const ordered = []
  featureOrder.value.forEach(k => { if (map.has(k)) { ordered.push(map.get(k)); map.delete(k) } })
  return ordered.concat([...map.values()])
})
const featureCards = computed(() => featureAllSorted.value.slice(0, featureDisplayCount.value))

function openFeatureDialog(){ featureDialogVisible.value = true }
/** 对话框保存回调：更新父页面配置立即生效 */
function onFeatureApply(cfg){
  featureOrder.value = cfg.order ?? []
  featureDisplayCount.value = cfg.count ?? 8
}

/** days 变化时仅刷新详情 */
watch(days, () => loadDeviceDetails())

/** 首次加载 */
onMounted(loadAll)
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
    <!-- 头部 -->
    <div class="px-4 lg:px-6 pt-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
      <div class="grid grid-cols-12 gap-4 items-start">
        <!-- 左：标题 + 状态牌 -->
        <div class="col-span-7 min-w-0">
          <div class="flex items-center gap-12">
            <h1 class="device-title truncate">{{ dev.device_name || '—' }}</h1>
            <div class="flex flex-col items-center">
              <div class="status-board" :class="'sb-'+statusInfo.type">
                <span class="sb-text">{{ statusInfo.label }}</span>
              </div>
              <div class="mt-1 text-[14px] opacity-80 text-center">
                评价时间 :
                <span class="font-medium">
                  {{
                    (data?.meta?.assessTime || data?.meta?.assess_time || data?.meta?.evaluate_time || dev?.evaluate_time)
                        ? (data?.meta?.assessTime || data?.meta?.assess_time || data?.meta?.evaluate_time || dev?.evaluate_time).replace('T',' ').slice(0,19)
                        : (snap?.diagnosis_time ? snap.diagnosis_time.replace('T',' ').slice(0,19) : '—')
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右：三KPI -->
        <div class="col-span-5">
          <div class="grid grid-cols-3 gap-3">
            <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
              <div class="kpi-label">健康度</div>
              <div class="kpi-value text-sky-500 dark:text-sky-300">{{ dev.health_level ?? '—' }}</div>
            </el-card>
            <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
              <div class="kpi-label">剩余寿命 RUL</div>
              <div class="kpi-value text-indigo-500 dark:text-indigo-300">
                {{ dev.remaining_life ?? '—' }}<span class="kpi-unit">天</span>
              </div>
            </el-card>
            <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
              <div class="kpi-label">置信度</div>
              <div class="kpi-value text-emerald-500 dark:text-emerald-300">
                {{ dev.confidence_level ?? '—' }}<span class="kpi-unit">%</span>
              </div>
            </el-card>
          </div>
        </div>
      </div>

      <!-- 选择器 -->
      <div class="mt-3 flex items-center gap-1">
        <el-select v-model="baseId" style="width:150px" @change="onBaseChange" placeholder="选择基地">
          <el-option v-for="base in baseList" :key="base.id" :label="base.name" :value="String(base.id)"/>
        </el-select>
        <el-select v-model="unitId" style="width:250px" @change="onUnitChange" placeholder="选择装置">
          <el-option v-for="unit in unitList" :key="unit.id" :label="unit.name" :value="String(unit.id)"/>
        </el-select>
        <el-select v-model="deviceId" style="width:250px" filterable @change="onDeviceChange" placeholder="选择设备">
          <el-option v-for="device in deviceList" :key="device.id" :label="device.device_name" :value="String(device.id)"/>
        </el-select>
        <el-button type="primary" size="small" @click="goUnitDetail">返回上一级</el-button>
      </div>

      <!-- 信息胶囊 -->
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <el-tag type="primary" effect="plain">编号：{{ dev.component_code || '—' }}</el-tag>
        <el-tag type="success" effect="plain">厂家：{{ dev.manufacturer || '—' }}</el-tag>
        <el-tag type="warning" effect="plain">安装：{{ dev.install_date || '—' }}</el-tag>
      </div>
    </div>

    <!-- 内容滚动区 -->
    <div class="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
      <el-skeleton :loading="loading" animated>
        <template #template><el-skeleton-item variant="rect" style="height:420px"/></template>

        <!-- 快捷操作 -->
        <div class="mb-4 flex items-center justify-between gap-3">
          <div class="text-xs opacity-70">* 高概率阈值：{{ highProbText }}；每条诊断可作为故障证据挂载。</div>
          <div class="flex items-center gap-2">
            <DeviceStatusAssessment
                :deviceInfo="dev"
                :allFeatures="featureAll"
                buttonText="开始故障诊断"
                buttonIcon="CircleCheck"
                buttonSize="large"
                buttonType="primary"
                :disabled="actionsDisabled || loading"
                @complete="handleAssessmentComplete"
                @error="handleAssessmentError"
                @cancel="() => showAssessment.value = false"
            />
            <el-button size="large" type="primary" :icon="CircleCheck" @click="goDiagnose" :disabled="actionsDisabled">开始故障诊断</el-button>
            <el-button size="large" type="primary" plain :icon="Upload" @click="goForecast" :disabled="actionsDisabled">趋势预测</el-button>
            <el-button size="large" type="success" @click="newOrLinkFault">新建故障 / 关联</el-button>
            <el-button size="large" type="primary" plain :icon="Document" @click="dialogFaultDiag = true">故障诊断面板</el-button>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4 min-h-0">
          <!-- 左列 -->
          <div class="col-span-4 min-w-0 flex flex-col gap-3">
            <!-- 图片 -->
            <el-card v-if="devImages.length" shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">设备图片</div>
                <el-tag v-if="devImages.length>1" size="small" effect="plain">{{ devImages.length }} 张</el-tag>
              </div>
              <div v-if="hasMultiImages" class="ratio-443-590">
                <el-carousel class="img-carousel" height="100%" indicator-position="outside" trigger="click" :autoplay="false">
                  <el-carousel-item v-for="img in devImages" :key="img.id">
                    <el-image :src="img.url" fit="contain" class="img-fill rounded-md" :preview-src-list="devImages.map(i=>i.url)" />
                  </el-carousel-item>
                </el-carousel>
              </div>
              <div v-else class="ratio-443-590">
                <el-image :src="devImages[0].url" fit="contain" class="img-fill rounded-md" :preview-src-list="[devImages[0].url]" />
              </div>
            </el-card>



            <!-- 最新特征值（两列卡片） -->
            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium text-lg">最新特征值</div>
                <el-button size="small" type="primary" link @click="openFeatureDialog">更多</el-button>
              </div>

              <div class="feat-grid">
                <div v-for="f in featureCards" :key="makeFeatKey(f)" class="feat-card">
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
              <div v-if="!featureCards.length" class="text-xs opacity-70">暂无特征</div>
            </el-card>

          </div>

          <!-- 右列：记录 + 趋势 -->
          <el-card class="col-span-8 min-w-0 dark:bg-neutral-800" shadow="never" body-style="padding:0">
            <div class="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div class="font-medium">诊断记录</div>
              <div class="flex items-center gap-2">
                <el-input v-model="keyword" size="small" placeholder="搜索故障/备注" clearable class="w-52"/>
                <el-checkbox v-model="onlyHigh" size="small">仅高概率</el-checkbox>
                <el-button size="small" :icon="Document" @click="exportSelected" :disabled="!selectedRows.length">导出（已选 {{ selectedRows.length }}）</el-button>
              </div>
            </div>

            <div class="max-h-full">
              <!-- 父表：按时间点聚合 -->
              <el-table :data="recordGroups" size="small" class="!bg-transparent" row-key="id">
                <!-- 展开列：嵌套子表 -->
                <el-table-column type="expand">
                  <template #default="{ row }">
                    <!-- 子表：就是你现在的明细表结构 -->
                    <el-table :data="row.children" size="small" class="!bg-transparent"
                              :row-key="r=>r.id" @selection-change="rows => onSubSelChange(row, rows)">
                      <el-table-column type="selection" width="40"/>
                      <el-table-column label=" " width="150">
<!--                        <template #default="{row}">{{ fmtDT(row.diagnose_time) }}</template>-->
                      </el-table-column>
                      <el-table-column label="故障名称" min-width="180" show-overflow-tooltip prop="fault_name"/>
                      <!-- 子表中，与“故障名称”列同级添加 -->
                      <el-table-column label="来源文件" min-width="180" show-overflow-tooltip prop="raw_file" />
                      <el-table-column label="概率" width="90">
                        <template #default="{row}">
                          <el-tag :type="row.probability >= (data?.meta?.highProbThreshold||70) ? 'danger':'info'" size="small">
                            {{ Math.round(row.probability) }}%
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="备注" min-width="200" show-overflow-tooltip prop="description"/>
                      <el-table-column label="操作" width="280" align="center">
                        <template #default="{row}">
                          <el-button size="small" type="primary" plain @click="markConfirmed(row)" :disabled="row.confirmed">
                            {{ row.confirmed ? '已确认' : '标记已确认' }}
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </template>
                </el-table-column>

                <!-- 父行列：聚合后的摘要 -->
                <el-table-column label="时间" width="250" prop="time"/>
                <el-table-column label="故障名称（合并）" min-width="260" show-overflow-tooltip prop="namesText"/>
                <el-table-column label="来源文件" min-width="220" show-overflow-tooltip prop="filesText"/>
                <el-table-column label="数量" width="80" align="center">
                  <template #default="{ row }"><el-tag size="small">{{ row.count }}</el-tag></template>
                </el-table-column>
              </el-table>


              <el-card shadow="never" class="dark:bg-neutral-800">
                <div class="flex items-center justify-between mb-2"><div class="font-medium">概率趋势（{{ days }}天）</div></div>
                <div ref="elProb" class="h-[220px]"></div>
              </el-card>
            </div>
          </el-card>
        </div>

        <!-- 抽屉/弹窗 -->
        <el-drawer v-model="drawerBasis.visible" title="诊断依据" size="50%">
          <div class="text-sm whitespace-pre-wrap">{{ drawerBasis.record?.diagnosis_basis || snap?.diagnosis_basis || '—' }}</div>
        </el-drawer>

        <el-drawer v-model="drawerRaw.visible" title="原始文件" size="40%">
          <div class="text-sm">文件ID：{{ drawerRaw.record?.raw_file_id || snap?.raw_file_id }}</div>
          <el-button type="primary" class="mt-3" @click="$message.success('模拟打开/下载源数据')">打开源数据</el-button>
        </el-drawer>

        <el-dialog v-model="dialogUpgrade.visible" title="升级为故障" width="640px">
          <div class="text-sm mb-3 opacity-80">将把所选诊断记录作为故障证据挂载。</div>
          <el-form label-width="110px">
            <el-form-item label="故障类型"><el-select class="w-52"><el-option label="机械" value="mech"/><el-option label="电气" value="elec"/><el-option label="工艺" value="proc"/></el-select></el-form-item>
            <el-form-item label="影响范围"><el-input class="w-80" placeholder="影响设备/产线/产品"/></el-form-item>
            <el-form-item label="负责人"><el-input class="w-52" placeholder="如：张工"/></el-form-item>
            <el-form-item label="说明"><el-input type="textarea" rows="3" placeholder="补充说明"/></el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="dialogUpgrade.visible=false">取消</el-button>
            <el-button type="warning" @click="dialogUpgrade.visible=false">确认升级</el-button>
          </template>
        </el-dialog>

        <el-dialog v-model="dialogForecast" title="趋势预测" width="560px">
          <div class="text-sm mb-3">选择关键特征后进行预测（占位）。</div>
          <el-select class="w-60" placeholder="选择特征">
            <el-option label="振动RMS" value="v_rms"/><el-option label="温度" value="temp"/><el-option label="电流" value="curr"/>
          </el-select>
          <template #footer>
            <el-button @click="dialogForecast=false">取消</el-button>
            <el-button type="primary" @click="dialogForecast=false">开始预测</el-button>
          </template>
        </el-dialog>

        <el-dialog v-model="dialogNewFault" title="新建故障 / 关联" width="560px">
          <el-radio-group>
            <el-radio label="new">新建故障</el-radio>
            <el-radio label="link">关联现有故障</el-radio>
          </el-radio-group>
          <div class="mt-3"><el-input placeholder="可选：现有故障编码进行关联"/></div>
          <template #footer>
            <el-button @click="dialogNewFault=false">取消</el-button>
            <el-button type="success" @click="dialogNewFault=false">提交</el-button>
          </template>
        </el-dialog>

        <el-dialog v-model="dialogFaultDiag" title="设备故障诊断" width="80vw" class="fd-dlg" append-to-body>
          <div class="h-full min-h-0 flex flex-col">
            <FaultDiagnosisPanel :device-name="dev.device_name || ('设备-' + deviceId)" :channel="dev.default_channel || 'CH-1'" :autorun="true"/>
          </div>
        </el-dialog>

        <!-- 新增：最新特征值配置对话框（独立组件） -->
        <FeatureConfigDialog
            v-model:visible="featureDialogVisible"
            :device-id="deviceId"
            :features="featureAll"
            :default-count="featureDisplayCount"
            :makeKey="makeFeatKey"
            :maxCount="24"
            @apply="onFeatureApply"
        />
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-card__body){ padding: 12px; }

/* 设备诊断面板弹窗布局 */
:deep(.fd-dlg .el-dialog){
  width: 80vw !important;
  height: 80vh;
  max-width: none;
  display: flex;
  flex-direction: column;
}
:deep(.fd-dlg .el-dialog__header),
:deep(.fd-dlg .el-dialog__footer){ flex: 0 0 auto; }
:deep(.fd-dlg .el-dialog__body){
  flex: 1 1 auto;
  overflow: hidden;
  padding: 0;
}

/* 图片比例盒 */
.ratio-443-590 { aspect-ratio: 443 / 590; width: 100%; max-height: clamp(220px, 30vh, 420px); }
.img-carousel { height: 100%; }
:deep(.img-carousel .el-carousel__container) { height: 100%; }
.img-fill { width: 100%; height: 100%; object-fit: contain; }

/* 标题 + 状态牌 */
.device-title{ font-size: clamp(32px, 6vw, 52px); font-weight: 700; line-height: 1; letter-spacing: .5px; white-space: nowrap; }
.status-board{ min-width: 160px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  padding: 0 12px; border: 1px solid rgba(255,255,255,.14); box-shadow: inset 0 0 0 1px rgba(0,0,0,.15); }
.sb-text{ font-size: 28px; font-weight: 600; letter-spacing: 2px; }
.sb-success{ background: #08af15; color: #f6f2f6; }
.sb-warning{ background: #ef9907; color: #f6f2f6; }
.sb-danger { background: #7a0a0a; color: #ffb3b3; }
.sb-info   { background: #3a3a3a; color: #dcdcdc; }

/* KPI 卡片 */
.kpi-card{ border: 1px solid rgba(0,0,0,.10); background: linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.05)); }
.dark .kpi-card{ border-color: rgba(255,255,255,.12); background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.05)); }
.kpi-label{ font-size: 13px; font-weight: 600; opacity: .9; }
.kpi-value{ margin-top: 2px; font-size: 28px; font-weight: 800; line-height: 1; }
.kpi-unit{ margin-left: 4px; font-size: 12px; font-weight: 700; opacity: .85; }

/* 快照卡片 */
.snap-card { text-align: left; }
.snap-item { font-size: 15px; margin-bottom: 8px; font-weight: 500; margin-left: 30px; }
.snap-sub  { font-size: 13px; opacity: 0.85; }

/* 最新特征值：两列小卡片 */
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

.snap-row{
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 8px;
  padding: 8px 10px;
  background: rgba(0,0,0,.02);
}
.dark .snap-row{
  border-color: rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
}
.row-top{
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  margin-bottom:6px;
}
.fault-name{
  font-weight:600; font-size:15px;
  max-width: 20em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.row-sub{
  display:flex; align-items:center; justify-content:space-between; gap:8px;
}
.row-actions{ flex:0 0 auto; }

</style>
