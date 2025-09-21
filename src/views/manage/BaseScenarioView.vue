<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SceneYard from '@/components/scene/SceneYard.vue'

import DeviceAssessmentModal from '@/buz/eavalue/DeviceAssessmentModal.vue'

import { getBasePageData, fetchUnitsByBase } from '@/mock/basePageService'
import { BASE_FORM_ID, getSysConfigFormId } from '@/api/constant/form_constant'
import { getAssessmentUnits, getBaseList } from '@/mock/fetchDataApi.js'

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

/** 直接给子组件的 items（后端保证字段正确性） */
const yardItems = ref<any[] | null>(null)

const selectedBase = computed(() =>
    baseList.value.find(b => String(b.id) === String(selectedBaseId.value)) || null
)

watch(() => route.params.baseId, (v) => {
  if (v) selectedBaseId.value = String(v)
}, { immediate: true })

const highProbText = computed(() => `Pθ=${data.value?.meta?.highProbThreshold || 70}%`)
const kpis     = computed(() => data.value?.kpis || {})
const baseInfo = computed(() => data.value?.base || {})

const rankRows = computed(() => {
  if (!data.value) return []
  switch (rankTab.value) {
    case 'devices':   return data.value.rankings.byHighProbDevices
    case 'diagnoses': return data.value.rankings.byHighProbDiagnoses
    case 'rul':       return data.value.rankings.byShortRULShare
    case 'lag':       return data.value.rankings.byCoverageLag
  }
  return []
})

const healthBuckets = computed(() => data.value?.deviceStats?.healthBuckets || [])
const rulBuckets    = computed(() => data.value?.deviceStats?.rulBuckets || [])

function tagLevel(level: string){
  return level === 'high' ? 'danger' : level === 'mid' ? 'warning' : 'success'
}
function goUnit(row: any){
  const unit = row?.unit
  if (!unit?.id) return
  router.push({ name:'ManageSysView', params:{ baseId: String(selectedBaseId.value), unitId: String(unit.id) } })
}
function applyBucketFilter(label: string){
  rankTab.value = label.includes('天') ? 'rul' : 'devices'
}

async function loadBaseList() {
  const res = await getBaseList()
  baseList.value = res || []
  selectedBaseId.value = route.params.baseId
      ? String(route.params.baseId)
      : (baseList.value[0] ? String(baseList.value[0].id) : null)

  if (selectedBaseId.value != null) {
    await Promise.all([load(), loadUnitsByBase()])
  }
}

async function load() {
  loading.value = true
  data.value = await getBasePageData(getSysConfigFormId(BASE_FORM_ID), selectedBaseId.value, {
    days: days.value, highProbThreshold: 70
  })
  assessmentUnits.value = await getAssessmentUnits(selectedBaseId.value)
  loading.value = false
}

async function loadUnitsByBase() {
  if (!selectedBaseId.value) { yardItems.value = []; return }
  const list = await fetchUnitsByBase(selectedBaseId.value, { pageSize: 200 })
  yardItems.value = list || []
}

watch(selectedBaseId, async () => {
  if (selectedBaseId.value == null) return
  await Promise.all([load(), loadUnitsByBase()])
})

onMounted(loadBaseList)
</script>

<template>
  <!-- 父容器：相对定位，由外层控制尺寸；本页不再强制全屏 -->
  <div class="scene-page relative text-neutral-900 dark:text-neutral-100">
    <!-- 3D 场景占满父容器 -->
    <SceneYard
        class="scene-bg"
        :items="yardItems"
        :page-size="200"
        :height= "'95vh'"
        :exposure="1.35"
    />

    <!-- 顶部渐变遮罩（不拦截事件） -->
    <div class="scene-vignette pointer-events-none" />

    <!-- 覆盖信息层：限制在父容器内 -->
    <div class="overlay-layer">
      <div class="overlay-content grid grid-cols-12 gap-4 p-4 lg:p-6">
        <!-- 左侧 -->
        <div class="col-span-3 flex flex-col gap-4">
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

        <!-- 中间空白，给 3D 视野 -->
        <div class="col-span-6"></div>

        <!-- 右侧 -->
        <div class="col-span-3 flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="kpi-lite"><div class="kpi-label">装置/设备</div><div class="kpi-value">{{ kpis.unitsCount || 0 }}/{{ kpis.devicesCount || 0 }}</div></div>
            <div class="kpi-lite"><div class="kpi-label">诊断次数</div><div class="kpi-value">{{ kpis.diagnosisCount || 0 }}</div></div>
            <div class="kpi-lite"><div class="kpi-label">高概率诊断</div><div class="kpi-value">{{ kpis.highProbCount || 0 }}</div></div>
            <div class="kpi-lite"><div class="kpi-label">高概率设备</div><div class="kpi-value">{{ kpis.highProbDevices || 0 }}</div></div>
          </div>

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
    </div>

    <el-dialog v-model="dialogAssess" title="任务评估" width="60vw" append-to-body>
      <DeviceAssessmentModal :devices="assessmentUnits"
                             :baseLat="baseInfo.latitude"
                             :baseLon="baseInfo.longitude"/>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ================= 基础布局（3D 受父容器约束） ================= */
.scene-bg{
  position:absolute; inset:0; z-index:0; pointer-events:auto;
}
.scene-vignette{
  position:absolute; inset:0; z-index:1; pointer-events:none;
  /* 更透明的顶部/底部渐变，避免压暗画面 */
  background:
      radial-gradient(1200px 600px at 50% 30%, rgba(0,0,0,.06), transparent 60%),
      linear-gradient(180deg, rgba(3,7,18,.28), transparent 25%, transparent 75%, rgba(3,7,18,.30));
}

/* ================= 覆盖信息层（变量集中） ================= */
.overlay-layer{
  position:absolute; inset:0; z-index:5; pointer-events:none;

  /* 全局变量：字号、留白、透明度 */
  --ov-font: 14px;         /* 正文字号 */
  --ov-title: 16px;        /* 标题字号 */
  --ov-kpi: 30px;          /* KPI 数值字号 */
  --ov-card-pad: 14px;     /* 卡片内边距 */
  --ov-card-gap: 12px;     /* 卡片之间间距 */
  --ov-bg-top: .80;        /* 玻璃背景上层透明度（更通透） */
  --ov-bg-bottom: .68;     /* 玻璃背景下层透明度 */
}
.overlay-content{
  height:100%;
  padding:18px 20px;       /* 覆盖 tailwind 的 p-4 / lg:p-6 */
  font-size: var(--ov-font);
  pointer-events:none;     /* 默认不拦截事件 */
}
/* 仅面板类元素可交互 */
.overlay-content .glass-wrap,
.overlay-content .glass-panel,
.overlay-content .kpi-lite,
.overlay-content :deep(.el-card),
.overlay-content :deep(.el-table){
  pointer-events:auto;
}

/* ================= 覆盖层卡片皮肤（与弹框一致的深色玻璃） ================= */
.overlay-layer .glass-wrap,
.overlay-layer .glass-panel,
.overlay-layer .kpi-lite,
.overlay-layer :deep(.el-card){
  position: relative;
  overflow: hidden;
  -webkit-backdrop-filter: blur(10px) saturate(1.08);
  backdrop-filter: blur(10px) saturate(1.08);
  background: linear-gradient(180deg,
  rgba(20,24,30,var(--ov-bg-top)),
  rgba(16,20,26,var(--ov-bg-bottom)));
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 12px;
  box-shadow: 0 12px 24px rgba(0,0,0,.32), inset 0 0 0 1px rgba(255,255,255,.06);
  color: #e8eaed !important;
  padding: var(--ov-card-pad);
  margin-bottom: var(--ov-card-gap);
  font-size: var(--ov-font);
}
/* 霓虹描边 */
.overlay-layer .glass-wrap::before,
.overlay-layer .glass-panel::before,
.overlay-layer .kpi-lite::before,
.overlay-layer :deep(.el-card)::before{
  content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  background:
      radial-gradient(140% 60% at 10% -10%, rgba(99,102,241,.22), transparent 55%),
      radial-gradient(120% 60% at 110% -20%, rgba(56,189,248,.20), transparent 50%);
  mask: linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
  -webkit-mask: linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
  padding:1px; border:1px solid transparent; opacity:.72;
}

/* 标题 / KPI */
.overlay-layer .panel-title{ font-weight:800; font-size: var(--ov-title); letter-spacing:.02em; }
.text-elevated{ text-shadow: 0 1px 2px rgba(255,255,255,.35), 0 0 10px rgba(255,255,255,.12); }
.overlay-layer .kpi-label{ font-size: calc(var(--ov-font) + 1px); color:#cfd3da; }
.overlay-layer .kpi-value{
  margin-top:4px; font-size: var(--ov-kpi); font-weight:900; letter-spacing:.01em;
  color:#fff; text-shadow: 0 1px 2px rgba(255,255,255,.18), 0 0 8px rgba(255,255,255,.10);
}

/* ================= Element Plus：卡片/表格/选择器/分段 ================= */
/* 卡片头 */
.overlay-layer :deep(.el-card__header){
  background: transparent !important;
  border-bottom: 1px solid rgba(255,255,255,.10) !important;
  color:#e8eaed !important;
  padding: 10px var(--ov-card-pad);
  font-size: var(--ov-font);
}

/* —— 表格（浅/深主题都在深色玻璃上，以此配色为准） —— */
.overlay-layer :deep(.el-table){
  background: transparent;           /* 不要默认白底 */
  color:#e8eaed;
  font-size: var(--ov-font);
  --el-table-border-color: rgba(255,255,255,.14);
  --el-table-header-bg-color: rgba(255,255,255,.08);
  --el-table-row-hover-bg-color: rgba(99,102,241,.16);
}
.overlay-layer :deep(.el-table th){
  background: var(--el-table-header-bg-color) !important;
  color:#cfd3da !important; font-weight:700; padding:10px 12px;
}
.overlay-layer :deep(.el-table td){ padding:9px 12px; line-height:1.5; }
.overlay-layer :deep(.el-table .cell),
.overlay-layer :deep(.el-table th .cell){ font-size: var(--ov-font); text-shadow:none; }
.overlay-layer :deep(.el-table--enable-row-hover .el-table__body tr:hover>td){
  background-color: var(--el-table-row-hover-bg-color) !important;
}

/* 选择器 */
.overlay-layer :deep(.el-select .el-input__wrapper){
  background: rgba(255,255,255,.10) !important;
  border: 1px solid rgba(255,255,255,.18) !important;
  box-shadow: none !important;
}
.overlay-layer :deep(.el-select .el-input__inner),
.overlay-layer :deep(.el-select .el-select__caret){
  color:#e8eaed !important; font-size: var(--ov-font);
}
.overlay-layer :deep(.el-select .el-input__inner::placeholder){
  color: rgba(232,234,237,.70) !important;
}

/* 分段控件 */
.overlay-layer :deep(.el-segmented){
  background: transparent !important;
  border: 1px solid rgba(255,255,255,.18); border-radius: 10px;
  font-size: calc(var(--ov-font) - 1px);
}
.overlay-layer :deep(.el-segmented__item){ color:#e8eaed; }
.overlay-layer :deep(.el-segmented__item.is-selected){ background: rgba(255,255,255,.10); font-weight:700; }

/* Tag */
.overlay-layer :deep(.el-tag){
  background: rgba(0,0,0,.28) !important;
  border-color: rgba(255,255,255,.22) !important;
  color:#f3f6fb !important;
}

/* ================= 分布卡片“小桶按钮” ================= */
.overlay-layer .bucket-btn{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:14px 10px; border-radius:10px; gap:6px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  color:#f8fafc; font-weight:600; font-size: calc(var(--ov-font) - 1px);
  transition:.18s ease;
}
.overlay-layer .bucket-btn:hover{ background: rgba(255,255,255,.18); }
.overlay-layer .bucket-btn > :first-child{ font-size:22px; font-weight:800; line-height:1.1; }
.overlay-layer .bucket-btn > :nth-child(2),
.overlay-layer .bucket-btn > :nth-child(3){ font-size:12px; opacity:.88; }

/* ================= 右侧整列字体放大（第三列） ================= */
.overlay-content > .col-span-3:last-child{
  --ov-font: 15px;   /* 正文 +1 */
  --ov-title: 18px;  /* 标题更大 */
  --ov-kpi: 34px;    /* KPI 数值更大 */
}
.overlay-content > .col-span-3:last-child :deep(.el-card__header){ font-size: 16px; }
.overlay-content > .col-span-3:last-child .kpi-label{ font-size: 16px; }


</style>

