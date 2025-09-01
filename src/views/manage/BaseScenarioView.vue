<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SceneYard from '@/components/scene/SceneYard.vue'

import ThemeToggle from '@/components/ThemeToggle.vue'
import DeviceAssessmentModal from '@/buz/eavalue/DeviceAssessmentModal.vue'

import { getBasePageData } from '@/mock/basePageService'
import { BASE_FORM_ID, getSysConfigFormId } from '@/api/constant/form_constant'
import { getAssessmentUnits, getBaseList } from '@/mock/fetchDataApi.js'

/* ====== 路由 / 交互 ====== */
const router = useRouter()
const route  = useRoute()

const days            = ref(7)
const loading         = ref(true)
const data            = ref<any|null>(null)
const rankTab         = ref<'devices'|'diagnoses'|'rul'|'lag'>('devices')
const dialogAssess    = ref(false)
const assessmentUnits = ref<any[]>([])

const baseList       = ref<any[]>([])
const selectedBaseId = ref<string|null>(null)

const selectedBase = computed(() =>
    baseList.value.find(b => String(b.id) === String(selectedBaseId.value)) || null
)

watch(
    () => route.params.baseId,
    (newBaseId) => { if (newBaseId) selectedBaseId.value = String(newBaseId) },
    { immediate: true }
)

/* ====== 衍生数据 ====== */
const highProbText = computed(() => `Pθ=${data.value?.meta?.highProbThreshold || 70}%`)
const kpis     = computed(() => data.value?.kpis || {})
const baseInfo = computed(() => data.value?.base || {})

const rankRows = computed(() => {
  if (!data.value) return []
  switch (rankTab.value) {
    case 'devices':    return data.value.rankings.byHighProbDevices
    case 'diagnoses':  return data.value.rankings.byHighProbDiagnoses
    case 'rul':        return data.value.rankings.byShortRULShare
    case 'lag':        return data.value.rankings.byCoverageLag
  }
  return []
})

const healthBuckets = computed(() => data.value?.deviceStats?.healthBuckets || [])
const rulBuckets    = computed(() => data.value?.deviceStats?.rulBuckets || [])

/* ====== 交互 ====== */
function tagLevel(level: string){
  return level === 'high' ? 'danger' : level === 'mid' ? 'warning' : 'success'
}
function goUnit(row: any){
  const unit = row?.unit
  if (!unit?.id) return
  router.push({ name:'ManageSysView', params:{ baseId: String(selectedBaseId.value), unitId: String(unit.id) } })
}
function applyBucketFilter(label: string){
  if (label.includes('天')) rankTab.value = 'rul'
  else                      rankTab.value = 'devices'
}

/* ====== 加载 ====== */
async function loadBaseList() {
  const res = await getBaseList()
  baseList.value = res || []
  selectedBaseId.value = route.params.baseId
      ? String(route.params.baseId)
      : (baseList.value[0] ? String(baseList.value[0].id) : null)
  if (selectedBaseId.value != null) await load()
}
async function load() {
  loading.value = true
  data.value = await getBasePageData(getSysConfigFormId(BASE_FORM_ID), selectedBaseId.value, {
    days: days.value, highProbThreshold: 70
  })
  assessmentUnits.value = await getAssessmentUnits(selectedBaseId.value)
  loading.value = false
}
onMounted(loadBaseList)
</script>

<template>
  <div class="scene-page relative min-h-screen text-neutral-900 dark:text-neutral-100">
    <!-- 背景三维场景 -->
    <SceneYard class="scene-bg" :height="'100vh'" :exposure="1.35"/>
    <div class="scene-vignette pointer-events-none" />

    <!-- 前景：左右两侧，中间空 -->
    <div class="relative z-10 grid grid-cols-12 gap-4 p-4 lg:p-6">
      <!-- 左侧 -->
      <div class="col-span-3 flex flex-col gap-4">
        <!-- 顶部条 -->
        <div class="glass-wrap p-3">
          <div class="flex flex-col gap-2">
            <el-select v-model="selectedBaseId" placeholder="请选择基地" style="width:100%;" @change="load">
              <el-option v-for="b in baseList" :key="b.id" :label="b.name" :value="String(b.id)" />
            </el-select>
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold">{{ selectedBase?.name || '请选择基地' }}</span>
              <el-tag size="small"
                      :type="(baseInfo.status==='Fault'?'danger':baseInfo.status==='Warning'?'warning':'success')">
                {{ baseInfo.status || 'Unknown' }}
              </el-tag>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs opacity-80">
              <el-segmented v-model="days" :options="[7,30]" size="small"/>
              <el-tag size="small" effect="plain">{{ highProbText }}</el-tag>
              <div>更新时间：{{ (baseInfo.time || '').replace('T',' ').slice(0,19) }}</div>
            </div>
          </div>
        </div>

        <!-- 风险榜 -->
        <el-card class="glass-panel flex-1" shadow="never" body-style="padding:0">
          <div class="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
            <div class="panel-title text-elevated">装置风险榜</div>
            <el-segmented v-model="rankTab"
                          :options="[{label:'高概率设备',value:'devices'},{label:'高概率诊断',value:'diagnoses'},{label:'RUL短期',value:'rul'},{label:'覆盖滞后',value:'lag'}]"
                          size="small"/>
          </div>
          <div class="max-h-[520px] overflow-auto">
            <el-table :data="rankRows" size="small" class="!bg-transparent" @row-click="goUnit">
              <el-table-column label="装置" min-width="120">
                <template #default="{row}">
                  <div class="flex items-center gap-2">
                    <span class="truncate" :title="row.unit.system_name">{{ row.unit.system_name }}</span>
                    <el-tag size="small"
                            :type="(row.unit.system_status==='Fault'?'danger':row.unit.system_status==='Warning'?'warning':'success')">
                      {{ row.unit.system_status }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="rankTab==='devices'" label="高概率设备" prop="diagSummary.highDevices" width="96"/>
              <el-table-column v-else-if="rankTab==='diagnoses'" label="高概率诊断" prop="diagSummary.highCount" width="96"/>
              <el-table-column v-else-if="rankTab==='rul'" label="Avg RUL" width="96">
                <template #default="{row}">{{ row.health.deviceAgg.avgRUL }}</template>
              </el-table-column>
              <el-table-column v-else label="最近诊断" width="112">
                <template #default="{row}">
                  {{ row.diagSummary.lastDiag ? row.diagSummary.lastDiag.replace('T',' ').slice(5,16) : '—' }}
                </template>
              </el-table-column>
              <el-table-column label="风险" width="84">
                <template #default="{row}">
                  <el-tag :type="tagLevel(row.risk.level)" size="small">{{ row.risk.level }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>

      <!-- 中间空出来 -->
      <div class="col-span-6"></div>

      <!-- 右侧 -->
      <div class="col-span-3 flex flex-col gap-4">
        <!-- KPI -->
        <div class="grid grid-cols-2 gap-3">
          <div class="kpi-lite"><div class="kpi-label">装置/设备</div><div class="kpi-value">{{ kpis.unitsCount || 0 }}/{{ kpis.devicesCount || 0 }}</div></div>
          <div class="kpi-lite"><div class="kpi-label">诊断次数</div><div class="kpi-value">{{ kpis.diagnosisCount || 0 }}</div></div>
          <div class="kpi-lite"><div class="kpi-label">高概率诊断</div><div class="kpi-value">{{ kpis.highProbCount || 0 }}</div></div>
          <div class="kpi-lite"><div class="kpi-label">高概率设备</div><div class="kpi-value">{{ kpis.highProbDevices || 0 }}</div></div>
        </div>

        <!-- 健康度分布 -->
        <el-card shadow="never" class="glass-panel">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">设备健康度分布</div>
            <el-tag size="small" effect="plain">点击分档筛装置</el-tag>
          </div>
          <div class="grid grid-cols-5 gap-2">
            <button v-for="b in healthBuckets" :key="b.label" @click="applyBucketFilter(b.label)" class="bucket-btn">
              <div class="text-sm font-medium">{{ b.count }}</div>
              <div class="text-[10px] opacity-70">{{ b.label }}</div>
              <div class="text-[10px] opacity-60">{{ b.percent }}%</div>
            </button>
          </div>
        </el-card>

        <!-- RUL 分布 -->
        <el-card shadow="never" class="glass-panel">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">RUL 分布（天）</div>
            <el-tag size="small" effect="plain">点击分档筛装置</el-tag>
          </div>
          <div class="grid grid-cols-5 gap-2">
            <button v-for="b in rulBuckets" :key="b.label" @click="applyBucketFilter(b.label)" class="bucket-btn">
              <div class="text-sm font-medium">{{ b.count }}</div>
              <div class="text-[10px] opacity-70">{{ b.label }}</div>
              <div class="text-[10px] opacity-60">{{ b.percent }}%</div>
            </button>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog v-model="dialogAssess" title="任务评估" width="60vw" append-to-body>
      <DeviceAssessmentModal :devices="assessmentUnits"
                             :baseLat="baseInfo.latitude"
                             :baseLon="baseInfo.longitude"/>
    </el-dialog>
  </div>
</template>

<style scoped>
/* =============== 场景背景（保持可交互） =============== */
.scene-bg{ position:fixed; inset:0; z-index:0; pointer-events:auto; }
.scene-vignette{
  position:fixed; inset:0; z-index:1; pointer-events:none;
  background:
      radial-gradient(1200px 600px at 50% 30%, rgba(0,0,0,.10), transparent 60%),
      linear-gradient(180deg, rgba(3,7,18,.40), transparent 25%, transparent 75%, rgba(3,7,18,.42));
}

/* 统一为浅色文字（覆盖容器上的 text-neutral-900 / dark:text-neutral-100） */
.scene-page{ color:#1e293b; }                /* slate-800 */
:global(html.dark) .scene-page{ color:#1e293b; }

/* =============== 玻璃容器（左面板 / 右面板 / KPI 卡） =============== */
.glass-wrap,
.glass-panel,
.kpi-lite{
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.08);
  background: rgba(255,255,255,.62);        /* 更透明的浅色 */
  color:#1e293b;
  box-shadow:
      0 8px 24px rgba(0,0,0,.12),
      inset 0 0 0 1px rgba(255,255,255,.14);
  transition: background .25s ease, box-shadow .25s ease, color .25s ease;
}
/* 深色主题下也保持“浅色玻璃 + 深色字” */
:global(html.dark) .glass-wrap,
:global(html.dark) .glass-panel,
:global(html.dark) .kpi-lite{
  border-color: rgba(0,0,0,.08);
  background: rgba(255,255,255,.62);
  color:#1e293b;
  box-shadow:
      0 10px 28px rgba(0,0,0,.28),
      inset 0 0 0 1px rgba(255,255,255,.14);
}

/* 面板标题更清晰（与模板中 .panel-title 配合） */
.panel-title{ font-weight:800; font-size:15px; letter-spacing:.02em; }
.text-elevated{
  text-shadow: 0 1px 2px rgba(255,255,255,.45), 0 0 10px rgba(255,255,255,.15);
}
/* 深色主题也用浅色描边风格（仍然要读得清） */
:global(html.dark) .text-elevated{
  text-shadow: 0 1px 2px rgba(255,255,255,.35), 0 0 10px rgba(255,255,255,.12);
}

/* =============== KPI 卡文案（更大更清楚） =============== */
.kpi-label{ font-size:14px; font-weight:700; opacity:.95; }
.kpi-value{ margin-top:4px; font-size:26px; font-weight:900; letter-spacing:.01em;
  text-shadow: 0 1px 2px rgba(255,255,255,.35), 0 0 8px rgba(255,255,255,.16);
}

/* =============== 分桶按钮（健康/RUL） =============== */
.bucket-btn{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:10px 6px; border-radius:10px;
  background: rgba(255,255,255,.50);
  color:#1e293b;
  border:1px solid rgba(0,0,0,.08);
  transition:.18s ease;
}
.bucket-btn:hover{
  background: rgba(255,255,255,.72);
  box-shadow: 0 6px 16px rgba(0,0,0,.12);
}
/* 深色主题下也保持同样的浅色风格 */
:global(html.dark) .bucket-btn{
  background: rgba(255,255,255,.50);
  color:#1e293b;
  border-color: rgba(0,0,0,.08);
}
:global(html.dark) .bucket-btn:hover{
  background: rgba(255,255,255,.72);
  box-shadow: 0 8px 20px rgba(0,0,0,.22);
}

/* =============== Element Plus 统一为浅色玻璃皮肤（深/浅一致） =============== */

/* Select 输入框 */
:deep(.el-select .el-input__wrapper){
  background: rgba(255,255,255,.50) !important;
  border: 1px solid rgba(0,0,0,.08) !important;
  box-shadow: none !important;
}
:deep(.el-select .el-input__inner),
:deep(.el-select .el-select__caret){ color:#1e293b; }
:deep(.el-select .el-input__inner::placeholder){ color: rgba(30,41,59,.60); }
/* 深色主题同样应用浅色样式 */
:global(html.dark) :deep(.el-select .el-input__wrapper){
  background: rgba(255,255,255,.50) !important;
  border-color: rgba(0,0,0,.08) !important;
}
:global(html.dark) :deep(.el-select .el-input__inner),
:global(html.dark) :deep(.el-select .el-select__caret){ color:#1e293b; }
:global(html.dark) :deep(.el-select .el-input__inner::placeholder){ color: rgba(30,41,59,.60); }

/* Tag（继承当前文字颜色） */
:deep(.el-tag){
  background: transparent !important;
  border-color: rgba(0,0,0,.20) !important;
  color: inherit !important;
  opacity:.95;
}

/* Segmented */
:deep(.el-segmented){
  background: transparent !important;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 10px;
}
:deep(.el-segmented__item){ background: transparent; color:#1e293b; }
:deep(.el-segmented__item.is-selected){
  background: rgba(255,255,255,.70);
  font-weight: 700;
}
/* 深色主题也保持同样浅色皮肤 */
:global(html.dark) :deep(.el-segmented){ border-color: rgba(0,0,0,.08); }
:global(html.dark) :deep(.el-segmented__item){ color:#1e293b; }
:global(html.dark) :deep(.el-segmented__item.is-selected){ background: rgba(255,255,255,.70); }

/* Table 玻璃 + 深色文字 */
:deep(.el-table){
  --el-table-border-color: rgba(0,0,0,.08);
  --el-table-header-bg-color: rgba(255,255,255,.38);
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(14,165,233,.10);
  color:#1e293b;
}
:deep(.el-table th){ background: var(--el-table-header-bg-color); font-weight:700; }
/* 深色主题同样浅色视觉 */
:global(html.dark) :deep(.el-table){
  --el-table-border-color: rgba(0,0,0,.08);
  --el-table-header-bg-color: rgba(255,255,255,.38);
  --el-table-row-hover-bg-color: rgba(14,165,233,.10);
  color:#1e293b;
}
:global(html.dark) :deep(.el-table th){ background: var(--el-table-header-bg-color); }

/* el-card 内部分隔线微调 */
.glass-panel :deep(.el-card__header){
  background: transparent;
  border-bottom: 1px solid rgba(0,0,0,.08);
}
:global(html.dark) .glass-panel :deep(.el-card__header){
  border-bottom-color: rgba(0,0,0,.08);
}

/* popper 容器（挂在 body 上，所以用 :global） */
:global(.el-select__popper) {
  /* 统一变量（有些子元素会读这些变量） */
  --el-bg-color-overlay: rgba(255,255,255,.86);
  --el-text-color-regular: #1e293b;        /* 深色文字 */
  --el-border-color-light: rgba(0,0,0,.08);

  background: var(--el-bg-color-overlay) !important;
  color: var(--el-text-color-regular) !important;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 28px rgba(0,0,0,.18);
}

/* 小三角箭头也保持浅色玻璃 */
:global(.el-select__popper .el-popper__arrow::before) {
  background: rgba(255,255,255,.86) !important;
  border: 1px solid rgba(0,0,0,.08) !important;
}

/* 列表项：默认/悬浮/选中 */
:global(.el-select__popper .el-select-dropdown__item) {
  color: #1e293b;                          /* 深色文字 */
}

:global(.el-select__popper .el-select-dropdown__item.hover) {
  background: rgba(14,165,233,.10);        /* 浅青色悬浮底 */
}

:global(.el-select__popper .el-select-dropdown__item.selected) {
  background: rgba(255,255,255,.72);
  font-weight: 700;
}

/* 过滤输入框（可搜索的下拉）统一玻璃风 */
:global(.el-select__popper .el-select-dropdown__wrap) {
  background: transparent;
}
:global(.el-select__popper .el-input__wrapper) {
  background: rgba(255,255,255,.6) !important;
  border: 1px solid rgba(0,0,0,.08) !important;
  box-shadow: none !important;
}
:global(.el-select__popper .el-input__inner) {
  color: #1e293b !important;
}
:global(.el-select__popper .el-input__inner::placeholder) {
  color: rgba(30,41,59,.55) !important;
}

/* 禁用项也要清晰可见 */
:global(.el-select__popper .el-select-dropdown__item.is-disabled) {
  color: rgba(30,41,59,.45) !important;
  background: transparent !important;
  cursor: not-allowed;
}

/* 输入框聚焦态（上方主输入框）补一个柔和高亮 */
:deep(.el-select .el-input.is-focus .el-input__wrapper),
:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(56,189,248,.18) inset !important;
  border-color: rgba(0,0,0,.12) !important;
}

/* 下拉箭头/清除图标颜色统一 */
:deep(.el-select .el-select__caret),
:deep(.el-select .el-select__icon) {
  color: #1e293b !important;
}
</style>

