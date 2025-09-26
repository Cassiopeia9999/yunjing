<script setup>
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { getDevicePageData } from '@/mock/deviceMock'
import { fetchDevices, getBaseList, getAssessmentUnits } from '@/mock/fetchDataApi'
import { ArrowRight, WarningFilled, CircleCheck, Upload, Document } from '@element-plus/icons-vue'
import FaultDiagnosisPanel from "@/components/alg/FaultDiagnosisPanel.vue";
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

/** 统一使用“字符串 id”，避免 1 vs "1" 不相等 **/
const baseId   = ref(null)   // v-model
const unitId   = ref(null)   // v-model
const deviceId = ref(null)   // v-model

/** 首次 & 变化：从路由同步三参（若存在） */
watch(() => route.params.baseId,   v => { if (v != null) baseId.value   = String(v) }, { immediate: true })
watch(() => route.params.unitId,   v => { if (v != null) unitId.value   = String(v) }, { immediate: true })
watch(() => route.params.deviceId, v => { if (v != null) deviceId.value = String(v) }, { immediate: true })

/** 其他状态 */
const days = ref(30)
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

/** 规则提示/QA */
const tips = computed(() => data.value?.riskTips || [])
const qa = computed(() => data.value?.qa || { passed: true, block: false, msg: '' })
const actionsDisabled = computed(() => qa.value?.block === true)
/** 固定字段：dev.dev_image 为 Array<{url,name,id}> 或空数组 */
// 固定字段：dev.dev_image 是 [{url,name,id}] 或 []
const devImages = computed(() => dev.value?.dev_image ?? []);
const hasMultiImages = computed(() => devImages.value.length > 1);

/** 图表 */
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


// 后端状态码: 1=正常, 2=预警, 3=故障, 4=停用
const STATUS_MAP = {
  '1': { label: '正常', type: 'success' },
  '2': { label: '预警', type: 'warning' },
  '3': { label: '故障', type: 'danger' },
  '4': { label: '停用', type: 'info' },
  default: { label: '未知', type: 'info' }
};

const statusInfo = computed(() => {
  const key = String(dev.value?.status ?? '');
  return STATUS_MAP[key] || STATUS_MAP.default;
});



/** ────────── 数据加载（自上而下保证有效） ────────── */
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
  loading.value = false
  await nextTick(); renderCharts()
}

const assessTime = computed(() => {
  const m = data.value?.meta || {};
  return m.assessTime || m.assess_time || m.evaluate_time || dev.value?.evaluate_time || '';
});

/** 入口 orchestrator：优先使用“路由传参”，否则逐级默认 */
async function loadAll(){
  loading.value = true
  const okBase   = await ensureBase();   if (!okBase) { loading.value = false; return }
  const okUnit   = await ensureUnit();   if (!okUnit) { loading.value = false; return }
  const okDevice = await ensureDevice(); if (!okDevice){ loading.value = false; return }
  await loadDeviceDetails()
}

/** 下拉切换时的联动（并可选同步到路由） */
async function onBaseChange(){
  unitId.value = null; deviceId.value = null
  const okUnit = await ensureUnit(); if (!okUnit) return
  const okDev  = await ensureDevice(); if (!okDev) return
  await loadDeviceDetails()
  // router.replace({ params: { ...route.params, baseId: baseId.value, unitId: unitId.value, deviceId: deviceId.value } })
}
async function onUnitChange(){
  deviceId.value = null
  const okDev = await ensureDevice(); if (!okDev) return
  await loadDeviceDetails()
  // router.replace({ params: { ...route.params, baseId: baseId.value, unitId: unitId.value, deviceId: deviceId.value } })
}
async function onDeviceChange(){ await loadDeviceDetails() /* 可同步路由 */ }

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

/** days 变化时仅刷新详情（不改选中项） */
watch(days, () => loadDeviceDetails())

/** 首次加载 */
onMounted(loadAll)
</script>



<template>
  <!-- 子页外层：服从框架，只内容滚动 -->
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
    <!-- 头部区（固定） -->
    <!-- 头部：按“图2”布局 -->
    <div class="px-4 lg:px-6 pt-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
      <!-- 第一行：左(标题+状态牌) | 右(KPI三块) -->
      <div class="grid grid-cols-12 gap-4 items-start">
        <!-- 左：大标题 + 状态牌 + 评价时间 -->
        <div class="col-span-7 min-w-0">
          <div class="flex items-center gap-12">
            <!-- 设备名（超大） -->
            <h1 class="device-title truncate">{{ dev.device_name || '—' }}</h1>

            <!-- 状态牌 + 评价时间（纵向居中） -->
            <div class="flex flex-col items-center">
              <div class="status-board" :class="'sb-'+statusInfo.type">
                <span class="sb-text">{{ statusInfo.label }}</span>
              </div>
              <div class="mt-1 text-[14px] opacity-80 text-center">
                评价时间 :
                <span class="font-medium">
                    {{
                              assessTime
                                  ? assessTime.replace('T',' ').slice(0,19)
                                  : (snap?.diagnosis_time ? snap.diagnosis_time.replace('T',' ').slice(0,19) : '—')
                            }}
                  </span>
              </div>
            </div>
          </div>
        </div>


        <!-- 右：三块 KPI -->
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

      <!-- 第二行：选择器 -->
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
      </div>

      <!-- 第三行：信息胶囊 -->
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <el-tag type="primary" effect="plain" size="default">
          编号：{{ dev.component_code || '—' }}
        </el-tag>
        <el-tag type="success" effect="plain" size="default">
          厂家：{{ dev.manufacturer || '—' }}
        </el-tag>
        <el-tag type="warning" effect="plain" size="default">
          安装：{{ dev.install_date || '—' }}
        </el-tag>
      </div>

    </div>


    <!-- 内容滚动区 -->
    <div class="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
      <el-skeleton :loading="loading" animated>
        <template #template><el-skeleton-item variant="rect" style="height:420px"/></template>
        <!-- 快捷操作 -->
        <div class="mb-4 flex items-center justify-between gap-3">
          <div class="text-xs opacity-70">
            * 高概率阈值：{{ highProbText }}；每条诊断可作为故障证据挂载。
          </div>
          <div class="flex items-center gap-2">
            <el-button size="large" type="primary" :icon="CircleCheck" @click="goDiagnose" :disabled="actionsDisabled">
              开始故障诊断
            </el-button>
            <el-button size="large" type="primary" plain :icon="Upload" @click="goForecast" :disabled="actionsDisabled">
              趋势预测
            </el-button>
            <el-button size="large" type="success" @click="newOrLinkFault">
              新建故障 / 关联
            </el-button>
            <!-- ✅ 新增：设备故障诊断操作面板入口 -->
            <el-button size="large" type="primary" plain :icon="Document" @click="dialogFaultDiag = true">
              故障诊断面板
            </el-button>
          </div>
        </div>
        <div class="grid grid-cols-12 gap-4 min-h-0">
          <!-- 左侧：最新诊断快照 + 风险提示 -->
          <div class="col-span-4 min-w-0 flex flex-col gap-3">

            <!-- 设备图片（放在左列顶部，按 443:590 比例显示） -->
            <el-card v-if="devImages.length" shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">设备图片</div>
                <el-tag v-if="devImages.length>1" size="small" effect="plain">
                  {{ devImages.length }} 张
                </el-tag>
              </div>

              <!-- 多图：轮播（保持比例） -->
              <div v-if="hasMultiImages" class="ratio-443-590">
                <el-carousel
                    class="img-carousel"
                    height="100%"
                indicator-position="outside"
                trigger="click"
                :autoplay="false"
                >
                <el-carousel-item v-for="img in devImages" :key="img.id">
                  <el-image
                      :src="img.url"
                      fit="contain"
                      class="img-fill rounded-md"
                      :preview-src-list="devImages.map(i=>i.url)"
                  />
                </el-carousel-item>
                </el-carousel>
              </div>


              <!-- 单图：保持比例 -->
              <div v-else class="ratio-443-590">
                <el-image
                    :src="devImages[0].url"
                    fit="contain"
                    class="img-fill rounded-md"
                    :preview-src-list="[devImages[0].url]"
                />
              </div>
            </el-card>


            <el-card shadow="never" class="dark:bg-neutral-800 snap-card">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium text-lg">最新诊断快照</div>
                <el-tag v-if="snap?.probability!=null" size="small"
                        :type="(snap.probability >= (data?.meta?.highProbThreshold||70)) ? 'danger':'info'">
                  {{ Math.round(snap.probability) }}%
                </el-tag>
              </div>

              <div class="snap-item">故障：{{ snap?.fault_name || '—' }}</div>
              <div class="snap-item">时间：{{ snap?.diagnosis_time ? snap.diagnosis_time.replace('T',' ').slice(0,19) : '—' }}</div>

              <div class="snap-item">
                依据（摘要）：<span class="snap-sub">{{ snap?.diagnosis_basis_short || '—' }}</span>
                <el-button v-if="snap" link size="small" @click="viewBasis(snap)">查看依据</el-button>
              </div>

              <div class="snap-item">
                原始文件：<span class="snap-sub">{{ snap?.raw_file_id || '—' }}</span>
                <el-button v-if="snap?.raw_file_id" link size="small" @click="viewRaw(snap)">查看源数据</el-button>
              </div>
            </el-card>


            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">风险提示与建议</div>
                <el-tag size="small" effect="plain">规则提示</el-tag>
              </div>
              <ul class="space-y-2 text-sm">
                <li v-for="(t,i) in tips" :key="i" class="flex items-start gap-2">
                  <el-icon class="mt-[2px]"><WarningFilled/></el-icon>
                  <span v-html="t"></span>
                </li>
                <li v-if="!tips?.length" class="text-xs opacity-70">暂无提示</li>
              </ul>
            </el-card>


          </div>

          <!-- 右侧：诊断记录时间线/表格 -->
          <el-card class="col-span-8 min-w-0 dark:bg-neutral-800" shadow="never" body-style="padding:0">
            <div class="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div class="font-medium">诊断记录</div>
              <div class="flex items-center gap-2">
                <el-input v-model="keyword" size="small" placeholder="搜索故障/备注" clearable class="w-52"/>
                <el-checkbox v-model="onlyHigh" size="small">仅高概率</el-checkbox>
                <el-button size="small" :icon="Document" @click="exportSelected" :disabled="!selectedRows.length">
                  导出（已选 {{ selectedRows.length }}）
                </el-button>
              </div>
            </div>

            <div class="max-h-full">
              <el-table
                  :data="records"
                  size="small"
                  class="!bg-transparent"
                  :row-class-name="()=>'cursor-default'"
                  @selection-change="onSelChange"
                  :row-key="r=>r.id"
              >
                <el-table-column type="selection" width="40"/>
                <el-table-column label="时间" width="170">
                  <template #default="{row}">
                    {{ row.diagnosis_time.replace('T',' ').slice(0,19) }}
                  </template>
                </el-table-column>
                <el-table-column label="故障名称" min-width="180" show-overflow-tooltip prop="fault_name"/>
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
                    <el-button size="small" type="warning" @click="upgradeToFault(row)">
                      升级为故障
                    </el-button>
                    <el-button size="small" link type="primary" @click="viewBasis(row)">查看依据</el-button>
                    <el-button size="small" link type="primary" @click="viewRaw(row)">原始文件</el-button>
                  </template>
                </el-table-column>
                <el-table-column width="44" align="center">
                  <template #default><el-icon><ArrowRight/></el-icon></template>
                </el-table-column>
              </el-table>

              <el-card shadow="never" class="dark:bg-neutral-800">
                <div class="flex items-center justify-between mb-2">
                  <div class="font-medium">概率趋势（{{ days }}天）</div>
                </div>
                <div ref="elProb" class="h-[220px]"></div>
              </el-card>
            </div>
          </el-card>


        </div>



        <!-- 依据抽屉 -->
        <el-drawer v-model="drawerBasis.visible" title="诊断依据" size="50%">
          <div class="text-sm whitespace-pre-wrap">{{ drawerBasis.record?.diagnosis_basis || snap?.diagnosis_basis || '—' }}</div>
        </el-drawer>

        <!-- 原始文件抽屉（占位） -->
        <el-drawer v-model="drawerRaw.visible" title="原始文件" size="40%">
          <div class="text-sm">文件ID：{{ drawerRaw.record?.raw_file_id || snap?.raw_file_id }}</div>
          <el-button type="primary" class="mt-3" @click="$message.success('模拟打开/下载源数据')">打开源数据</el-button>
        </el-drawer>

        <!-- 升级为故障 -->
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

        <!-- 趋势预测 -->
        <el-dialog v-model="dialogForecast" title="趋势预测" width="560px">
          <div class="text-sm mb-3">选择关键特征后进行预测（占位）。</div>
          <el-select class="w-60" placeholder="选择特征"><el-option label="振动RMS" value="v_rms"/><el-option label="温度" value="temp"/><el-option label="电流" value="curr"/></el-select>
          <template #footer>
            <el-button @click="dialogForecast=false">取消</el-button>
            <el-button type="primary" @click="dialogForecast=false">开始预测</el-button>
          </template>
        </el-dialog>

        <!-- 新建/关联故障 -->
        <el-dialog v-model="dialogNewFault" title="新建故障 / 关联" width="560px">
          <el-radio-group>
            <el-radio label="new">新建故障</el-radio>
            <el-radio label="link">关联现有故障</el-radio>
          </el-radio-group>
          <div class="mt-3">
            <el-input placeholder="可选：现有故障编码进行关联"/>
          </div>
          <template #footer>
            <el-button @click="dialogNewFault=false">取消</el-button>
            <el-button type="success" @click="dialogNewFault=false">提交</el-button>
          </template>
        </el-dialog>

        <el-dialog
            v-model="dialogFaultDiag"
            title="设备故障诊断"
            width="80vw"
            class="fd-dlg"
            append-to-body
        >
          <div class="h-full min-h-0 flex flex-col">
            <FaultDiagnosisPanel
                :device-name="dev.device_name || ('设备-' + deviceId)"
                :channel="dev.default_channel || 'CH-1'"
                :autorun="true"
            />
          </div>
        </el-dialog>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-card__body){ padding: 12px; }

/* 弹窗整体占 80% 视口高，并用 flex 布局分配空间 */
:deep(.fd-dlg .el-dialog){
  width: 80vw !important;
  height: 80vh;            /* 关键：固定高度 */
  max-width: none;
  display: flex;
  flex-direction: column;
}
/* 头/尾固定高度，body 扩展 */
:deep(.fd-dlg .el-dialog__header),
:deep(.fd-dlg .el-dialog__footer){
  flex: 0 0 auto;
}
:deep(.fd-dlg .el-dialog__body){
  flex: 1 1 auto;          /* 关键：填满剩余高度 */
  overflow: hidden;        /* 滚动交给内部各区（表格/Tabs） */
  padding: 0;              /* 需要留内边距可自行调整 */
}

/* 若面板内部使用了 <el-tabs>，让内容区可拉伸 */
:deep(.fd-dlg .el-tabs){ height: 100%; display: flex; flex-direction: column; }
:deep(.fd-dlg .el-tabs__content){ flex: 1 1 auto; min-height: 0; overflow: auto; }
/* 你的 <style scoped> 末尾增加，可要可不要 */
.dev-img-wrap { border-radius: 8px; overflow: hidden; }
/* 443:590（宽:高）的纵向比例盒；高度做限制避免过长 */
/* 443:590 比例盒 */
.ratio-443-590 {
  aspect-ratio: 443 / 590;
  width: 100%;
  max-height: clamp(220px, 30vh, 420px);
}

/* 让轮播与其内部容器都吃满比例盒高度 */
.img-carousel { height: 100%; }
:deep(.img-carousel .el-carousel__container) { height: 100%; }

/* 图片等比填充 */
.img-fill { width: 100%; height: 100%; object-fit: contain; }

/* —— 图2强调点：超大设备名 + 状态牌 + 清晰边框 —— */

/* 大标题：和截图同级的“视觉分量” */
.device-title{
  font-size: clamp(32px, 6vw, 52px); /* 1号主泵 的量级 */
  font-weight: 700;
  line-height: 1;
  letter-spacing: .5px;
  white-space: nowrap;
}

/* 状态牌：尺寸固定/圆角矩形/绿色为主，其他状态自动换色 */
.status-board{
  min-width: 160px;
  height: 48px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.15);
}
.sb-text{
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 2px;
}

/* 颜色方案（跟随 statusInfo.type） */
.sb-success{ background: #08af15; color: #f6f2f6; }  /* 正常：深绿底、荧绿字 */
.sb-warning{ background: #ef9907; color: #f6f2f6; }  /* 预警 */
.sb-danger { background: #7a0a0a; color: #ffb3b3; }  /* 故障 */
.sb-info   { background: #3a3a3a; color: #dcdcdc; }  /* 停用/未知 */

/* KPI 卡片：有“线条感”的边框与微渐变 */
.kpi-card{
  border: 1px solid rgba(0,0,0,.10);
  background: linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.05));
}
.dark .kpi-card{
  border-color: rgba(255,255,255,.12);
  background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.05));
}
.kpi-label{ font-size: 13px; font-weight: 600; opacity: .9; }
.kpi-value{ margin-top: 2px; font-size: 28px; font-weight: 800; line-height: 1; }
.kpi-unit{ margin-left: 4px; font-size: 12px; font-weight: 700; opacity: .85; }

/* 信息胶囊（编号/厂家/安装） */
.meta-chip{
  display: inline-block;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1;
  border: 1px solid rgba(0,0,0,.12);
  background: rgba(0,0,0,.03);
}
.dark .meta-chip{
  border-color: rgba(255,255,255,.16);
  background: rgba(255,255,255,.04);
}

/* 维持你原来的卡片内边距 */
:deep(.el-card__body){ padding: 12px; }
/* 快照卡片：整体左对齐 */
.snap-card {
  text-align: left;
}

/* 主行字体 */
.snap-item {
  font-size: 15px;   /* 比原来大一号 */
  margin-bottom: 8px;
  font-weight: 500;
  margin-left: 30px;
}

/* 辅助信息字体 */
.snap-sub {
  font-size: 13px;
  opacity: 0.85;
}

</style>
