<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getDecisionPageData,
  postMaintenanceDecision,
  exportWord,
  exportPdf,
  createWorkOrder
} from '@/mock/maintenanceMock'
import { Document, Download, Tickets } from '@element-plus/icons-vue'
import { getSysConfigFormId, REPAIR_RECORD_FORM_ID } from '@/api/constant/form_constant.js'

// 路由 & 外部页跳转
const router = useRouter()
const buildLowcodeUrl = (formId) => `/lowcode/dynamicInfo/index/${formId}`
function goRepairRecord () {
  const url = buildLowcodeUrl(getSysConfigFormId(REPAIR_RECORD_FORM_ID))
  router.push({ path: '/inner/lowcodeframe', query: { url } })
}

// 状态
const loading = ref(true)
const submitting = ref(false)
const exporting = ref(false)
const workOrderCreated = ref(true) // 生成工单后显示“填写维修记录”按钮

const unitId = ref('U-001') // 可从路由或上页传入
const data = ref(null)
const strategies = ref([])

// 派生/表单
const dev = computed(()=> data.value?.deviceInfo || {})
const periods = computed(()=> data.value?.enums?.periodOptions || [])
const faults = computed(()=> data.value?.enums?.faultList || [])

const form = ref({
  period: '1_month',
  customRange: null,      // 自定义日期范围 [start, end]
  faultCodes: [],
})

// 页面初始化
async function init(){
  loading.value = true
  data.value = await getDecisionPageData(unitId.value)
  loading.value = false
  strategies.value = data.value.defaultStrategies || []
  form.value.period = data.value?.deviceInfo?.period?.type ?? '1_month'
}

// 提交获取策略
async function fetchDecision(){
  submitting.value = true
  try {
    const payload = {
      unitId: unitId.value,
      period: form.value.period,
      faultCodes: form.value.faultCodes,
      RUL: dev.value.RUL,
      healthRate: dev.value.healthRate,
      confidence: (dev.value.confidence || 80) / 100,
      ...(form.value.period === 'custom' && form.value.customRange?.length === 2
          ? { customRange: form.value.customRange } : {})
    }
    strategies.value = await postMaintenanceDecision(payload)
  } finally {
    submitting.value = false
  }
}

// 底部操作
async function onExport(type){
  exporting.value = true
  try {
    const payload = { unitId: unitId.value, form: form.value, strategies: strategies.value }
    if (type === 'word') await exportWord(payload)
    else await exportPdf(payload)
    ElMessage.success('导出成功（mock）')
  } finally {
    exporting.value = false
  }
}
async function onCreateWO(){
  const res = await createWorkOrder({ unitId: unitId.value, strategies: strategies.value })
  if (res?.ok) {
    workOrderCreated.value = true
    ElMessage.success(`工单已创建：${res.id}（mock）`)
  }
}

// 行为：生成任务（单策略）
async function createTaskForStrategy(s){
  const res = await createWorkOrder({ unitId: unitId.value, strategy: s })
  if (res?.ok) {
    workOrderCreated.value = true
    ElMessage.success(`已为该策略创建工单：${res.id}（mock）`)
  }
}

onMounted(init)
</script>

<template>
  <!-- 外层：只内容滚动，头部固定 -->
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">

    <!-- 装置信息展示区（固定） -->
    <div class="p-4 lg:p-6 border-b border-neutral-200 dark:border-neutral-700">
      <div class="text-lg font-semibold mb-3">维修决策</div>
      <el-descriptions :column="5" size="small" border class="dark:bg-neutral-800">
        <el-descriptions-item label="装置名称">{{ dev.unitName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="装置编号">{{ dev.unitId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="健康度">
          <el-tag :type="dev.healthRate>=80?'success':dev.healthRate>=65?'warning':'danger'" size="small">
            {{ dev.healthRate ?? '—' }}%
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="剩余寿命 (RUL)">{{ dev.RUL ?? '—' }} 天</el-descriptions-item>
        <el-descriptions-item label="置信度">
          <el-tag type="info" size="small">{{ dev.confidence ?? '—' }}%</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 内容滚动区 -->
    <div class="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
      <el-skeleton :loading="loading" animated>
        <template #template><el-skeleton-item variant="rect" style="height:320px"/></template>

        <!-- 输入表单区 -->
        <el-card shadow="never" class="dark:bg-neutral-800 mb-4">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="font-medium">输入参数</div>
              <div class="text-xs opacity-70">周期选择 + 故障码选择</div>
            </div>
          </template>

          <el-form label-width="90px" class="grid grid-cols-12 gap-4 items-center">
            <el-form-item label="管理周期" class="col-span-4">
              <el-select v-model="form.period" class="w-full" @change="v => v!=='custom' && (form.customRange=null)">
                <el-option v-for="p in periods" :key="p.value" :label="p.label" :value="p.value"/>
              </el-select>
            </el-form-item>

            <el-form-item v-if="form.period==='custom'" label="时间范围" class="col-span-6">
              <el-date-picker
                  v-model="form.customRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  class="w-full"
              />
            </el-form-item>

            <el-form-item label="故障码选择" class="col-span-12">
              <el-select v-model="form.faultCodes" class="w-full" multiple filterable collapse-tags collapse-tags-tooltip
                         placeholder="从当前装置故障列表中选择">
                <el-option v-for="f in faults" :key="f.code" :label="`${f.code} · ${f.name}`" :value="f.code"/>
              </el-select>
            </el-form-item>

            <div class="col-span-12 flex items-center justify-end gap-2">
              <el-button type="primary" :loading="submitting" @click="fetchDecision">获取维修建议</el-button>
            </div>
          </el-form>
        </el-card>

        <!-- 维修策略展示区（横向对比） -->
        <div class="grid grid-cols-12 gap-4">
          <el-card v-for="(s,idx) in strategies" :key="idx" class="col-span-4 min-w-0 dark:bg-neutral-800" shadow="hover">
            <div class="flex items-center justify-between mb-2">
              <div class="font-medium">{{ s.strategy }}</div>
              <el-tag size="small">方案 {{ idx+1 }}</el-tag>
            </div>

            <div class="text-sm grid grid-cols-2 gap-y-2">
              <div class="opacity-70">预计时长</div><div>{{ s.time || '—' }}</div>
              <div class="opacity-70">成本(元)</div><div>{{ s.manpowerCost?.toLocaleString?.() ?? s.manpowerCost }}</div>
              <div class="opacity-70">经济收益(元)</div><div>{{ s.economy?.toLocaleString?.() ?? s.economy }}</div>
              <div class="opacity-70">配件清单</div>
              <div class="flex flex-wrap gap-1">
                <el-tag v-for="p in (s.parts||[])" :key="p" size="small" effect="plain">{{ p }}</el-tag>
                <span v-if="!s.parts?.length" class="opacity-60">—</span>
              </div>
              <div class="opacity-70">风险降低</div>
              <div class="flex items-center gap-2">
                <el-progress :percentage="s.effectPct || parseInt((s.effect||'').match(/\d+/)?.[0] ?? 0)"
                             :status="(s.effectPct??0)>=80?'success':(s.effectPct??0)>=60?'warning':''"
                             :stroke-width="10" class="flex-1"/>
                <span class="w-12 text-right">{{ s.effectPct ?? (s.effect||'').match(/\d+/)?.[0] ?? 0 }}%</span>
              </div>
            </div>

            <div class="mt-3 flex items-center justify-end gap-2">
              <el-button size="small" type="success" @click="createTaskForStrategy(s)">生成任务</el-button>
            </div>
          </el-card>

          <div v-if="!strategies?.length" class="col-span-12 text-sm opacity-70">
            未获取到策略，请调整条件后重试。
          </div>
        </div>

        <!-- 底部操作按钮区 -->
        <div class="mt-6 flex items-center justify-between gap-3">
          <div class="text-xs opacity-70">
            * 建议基于当前健康度、RUL、置信度以及选择的故障码生成；仅供参考。
          </div>
          <div class="flex items-center gap-2">
            <el-button :icon="Document" :loading="exporting" @click="onExport('word')">导出 Word</el-button>
            <el-button :icon="Download" :loading="exporting" @click="onExport('pdf')">导出 PDF</el-button>
            <el-button type="primary" :icon="Tickets" @click="onCreateWO">生成工单</el-button>
            <el-button v-if="workOrderCreated" type="success" @click="goRepairRecord">填写维修记录</el-button>
            <el-button @click="$router.back()">关闭</el-button>
          </div>
        </div>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-card__body){ padding: 12px; }
</style>
