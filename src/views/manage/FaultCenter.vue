<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { fetchFaultPage, fetchFaultStats, HIGH_PROB_THRESHOLD } from '@/mock/faultCenter.mock'
import { Search, Refresh, Download, Setting, Edit, Tools } from '@element-plus/icons-vue'

// 过滤条件
const q = reactive({
  keyword: '',
  period: '30d',             // 快捷周期：7d / 30d / 90d / custom
  dateRange: [],             // 自定义时间
  probRange: [0, 100],       // 故障概率（%）
  status: 'all',             // all/unhandled/handling/closed
  highOnly: false,
  page: 1,
  pageSize: 10,
})

// 列表与统计
const loading = ref(false)
const list = ref([])
const total = ref(0)
const stats = ref({ total: 0, today: 0, high: 0, unhandled: 0, threshold: HIGH_PROB_THRESHOLD })

// 选中
const selection = ref([])

// 抽屉/弹窗
const drawerBasis = ref({ visible: false, row: null })
const dlgDispose = ref({ visible: false, row: null })
const router = useRouter()

// 快捷周期 → 时间范围
function applyPeriod() {
  if (q.period === 'custom') return
  const now = new Date()
  const end = new Date(now)
  const start = new Date(now)
  const map = { '7d': 7, '30d': 30, '90d': 90 }
  start.setDate(start.getDate() - (map[q.period] || 30))
  q.dateRange = [start.toISOString(), end.toISOString()]
}

// 查询列表
async function load() {
  loading.value = true
  try {
    applyPeriod()
    const { list: rows, total: t } = await fetchFaultPage({
      page: q.page,
      pageSize: q.pageSize,
      keyword: q.keyword,
      dateRange: q.dateRange,
      probRange: q.probRange,
      status: q.status,
      highOnly: q.highOnly,
    })
    list.value = rows
    total.value = t
  } finally {
    loading.value = false
  }
}

// 统计
async function loadStats() {
  stats.value = await fetchFaultStats()
}

// 重置
function resetFilters() {
  q.keyword = ''
  q.period = '30d'
  q.dateRange = []
  q.probRange = [0, 100]
  q.status = 'all'
  q.highOnly = false
  q.page = 1
  load()
}

// 导出（选中）
function exportSelected() {
  const rows = selection.value
  if (!rows.length) return
  const header = ['id', 'component_name', 'fault_name', 'probability', 'diagnosis_time', 'status']
  const csv = [header.join(',')].concat(
      rows.map(r => [r.id, r.component_name, r.fault_name, r.probability, r.diagnosis_time, r.status].join(','))
  ).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `faults_${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// 行操作：查看依据
function openBasis(row) {
  drawerBasis.value = { visible: true, row }
}
// 行操作：获取维修决策（跳转维修决策页，携带 unitId/component_id）
function openDecision(row) {
  router.push({
    name: 'maintenance-decision', // 你的路由名
    query: {
      unitId: row.component_id,
      faultId: row.id,
      faultName: row.fault_name,
    }
  })
}
// 行操作：处置（新建工单/指派）
function openDispose(row) {
  dlgDispose.value = { visible: true, row: { ...row } }
}

function onSelChange(rows) {
  selection.value = rows || []
}

onMounted(async () => {
  await loadStats()
  await load()
})

const probTagType = (p) => (p >= stats.value.threshold ? 'danger' : p >= 50 ? 'warning' : 'info')
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-4 lg:p-6">
    <!-- 顶部：标题 + 快捷统计 -->
    <div class="mb-4">
      <div class="flex items-center justify-between">
        <div class="text-2xl font-bold tracking-tight">故障管理</div>
        <div class="text-sm text-neutral-700 dark:text-neutral-300">
          高概率阈值：{{ stats.threshold }}%
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <!-- 全部故障 -->
        <div class="rounded-xl p-4 border border-indigo-200 dark:border-indigo-900
                bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-neutral-900">
          <div class="text-sm font-medium text-neutral-800 dark:text-neutral-100">全部故障</div>
          <div class="mt-1 text-3xl lg:text-4xl font-bold leading-tight
                  text-indigo-600 dark:text-indigo-300">
            {{ stats.total }}
          </div>
        </div>

        <!-- 今日新增 -->
        <div class="rounded-xl p-4 border border-emerald-200 dark:border-emerald-900
                bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-neutral-900">
          <div class="text-sm font-medium text-neutral-800 dark:text-neutral-100">今日新增</div>
          <div class="mt-1 text-3xl lg:text-4xl font-bold leading-tight
                  text-emerald-600 dark:text-emerald-300">
            {{ stats.today }}
          </div>
        </div>

        <!-- 高概率 -->
        <div class="rounded-xl p-4 border border-rose-200 dark:border-rose-900
                bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-neutral-900">
          <div class="text-sm font-medium text-neutral-800 dark:text-neutral-100">
            高概率(≥{{ stats.threshold }}%)
          </div>
          <div class="mt-1 text-3xl lg:text-4xl font-bold leading-tight
                  text-rose-600 dark:text-rose-300">
            {{ stats.high }}
          </div>
        </div>

        <!-- 未处置 -->
        <div class="rounded-xl p-4 border border-amber-200 dark:border-amber-900
                bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-neutral-900">
          <div class="text-sm font-medium text-neutral-800 dark:text-neutral-100">未处置</div>
          <div class="mt-1 text-3xl lg:text-4xl font-bold leading-tight
                  text-amber-600 dark:text-amber-300">
            {{ stats.unhandled }}
          </div>
        </div>
      </div>
    </div>


    <!-- 过滤工具条（吸顶） -->
    <div class="sticky top-0 z-10 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-neutral-50/90 dark:bg-neutral-950/90 backdrop-blur border-y border-neutral-200 dark:border-neutral-700">
      <div class="grid grid-cols-12 gap-3 items-end">
        <el-input
            v-model="q.keyword"
            :prefix-icon="Search"
            placeholder="搜索：故障名称 / 部件 / 备注"
            class="col-span-12 lg:col-span-3"
            clearable
            @keyup.enter="q.page=1;load()"
        />
        <div class="col-span-12 lg:col-span-3">
          <div class="text-xs opacity-70 mb-1">快捷周期</div>
          <el-segmented v-model="q.period" :options="[{label:'近7天',value:'7d'},{label:'近30天',value:'30d'},{label:'近90天',value:'90d'},{label:'自定义',value:'custom'}]" @change="applyPeriod" />
        </div>
        <el-date-picker
            v-model="q.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            class="col-span-12 lg:col-span-4"
            :disabled="q.period!=='custom'"
        />
        <div class="col-span-12 lg:col-span-2">
          <div class="text-xs opacity-70 mb-1">概率范围（%）</div>
          <el-slider v-model="q.probRange" range :min="0" :max="100" @change="q.page=1;load()" />
        </div>
        <div class="col-span-12 lg:col-span-3 flex items-end gap-2">
          <el-select v-model="q.status" class="w-36" @change="q.page=1;load()">
            <el-option label="全部状态" value="all" />
            <el-option label="未处置" value="unhandled" />
            <el-option label="处置中" value="handling" />
            <el-option label="已关闭" value="closed" />
          </el-select>
          <el-checkbox v-model="q.highOnly" @change="q.page=1;load()">仅高概率</el-checkbox>
          <el-button type="primary" @click="q.page=1;load()">查询</el-button>
          <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 列表 -->
    <div class="flex-1 min-h-0 mt-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div class="font-medium">诊断结果列表</div>
        <div class="flex items-center gap-2">
          <el-button :icon="Download" size="small" :disabled="!selection.length" @click="exportSelected">
            导出（已选 {{ selection.length }}）
          </el-button>
          <el-button :icon="Setting" size="small" text>列设置</el-button>
        </div>
      </div>

      <el-table
          :data="list"
          v-loading="loading"
          @selection-change="onSelChange"
          :row-key="r => r.id"
          class="!bg-transparent"
          height="100%"
          border
          fit
      >
        <el-table-column type="selection" width="44" fixed="left" />
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column label="关联部件" min-width="200">
          <template #default="{ row }">
            <div class="flex flex-col">
              <div class="font-medium">{{ row.component_name }}</div>
              <div class="text-xs opacity-70">{{ row.system_name }} · {{ row.component_code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fault_name" label="故障名称" min-width="160" />
        <el-table-column prop="probability" label="故障概率" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="probTagType(row.probability)" round>{{ row.probability }}%</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="diagnosis_time" label="诊断时间" width="180">
          <template #default="{ row }">{{ row.diagnosis_time.replace('T', ' ').slice(0, 19) }}</template>
        </el-table-column>
        <el-table-column prop="raw_file_name" label="关联原始文件" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status==='unhandled'" type="warning" effect="light">未处置</el-tag>
            <el-tag v-else-if="row.status==='handling'" type="info" effect="light">处置中</el-tag>
            <el-tag v-else type="success" effect="light">已关闭</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain :icon="Edit" @click="openBasis(row)">查看依据</el-button>
            <el-button size="small" type="success" :icon="Tools" @click="openDecision(row)">维修决策</el-button>
            <el-button size="small" type="warning" @click="openDispose(row)">处置</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="p-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div class="text-xs opacity-70">共 {{ total }} 条</div>
        <el-pagination
            v-model:current-page="q.page"
            v-model:page-size="q.pageSize"
            :total="total"
            layout="prev, pager, next, jumper, sizes"
            :page-sizes="[10, 20, 50]"
            @current-change="load"
            @size-change="()=>{ q.page=1; load() }"
        />
      </div>
    </div>

    <!-- 抽屉：诊断依据 -->
    <el-drawer v-model="drawerBasis.visible" title="诊断依据" size="45%">
      <template #header>
        <div class="flex flex-col">
          <div class="font-medium">诊断依据</div>
          <div class="text-xs opacity-70">
            故障：{{ drawerBasis.row?.fault_name }} · 部件：{{ drawerBasis.row?.component_name }}
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="编号">{{ drawerBasis.row?.id }}</el-descriptions-item>
          <el-descriptions-item label="诊断时间">{{ drawerBasis.row?.diagnosis_time?.replace('T',' ').slice(0,19) }}</el-descriptions-item>
          <el-descriptions-item label="概率">{{ drawerBasis.row?.probability }}%</el-descriptions-item>
          <el-descriptions-item label="原始文件">{{ drawerBasis.row?.raw_file_name }}</el-descriptions-item>
        </el-descriptions>
        <div class="text-sm whitespace-pre-wrap p-3 rounded bg-neutral-50 dark:bg-neutral-800">
          {{ drawerBasis.row?.diagnosis_basis || '无' }}
        </div>
      </div>
    </el-drawer>

    <!-- 弹窗：处置（新建工单/指派） -->
    <el-dialog v-model="dlgDispose.visible" title="故障处置" width="560px">
      <el-form label-width="90px" :model="dlgDispose.row">
        <el-form-item label="故障名称">
          <el-input v-model="dlgDispose.row.fault_name" disabled />
        </el-form-item>
        <el-form-item label="处置类型">
          <el-select placeholder="选择类型">
            <el-option label="检修/换件" value="repair"/>
            <el-option label="复测/观察" value="retest"/>
            <el-option label="误报关闭" value="close"/>
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input placeholder="如：张工"/>
        </el-form-item>
        <el-form-item label="说明">
          <el-input type="textarea" rows="3" placeholder="补充处置说明"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgDispose.visible=false">取消</el-button>
        <el-button type="warning" @click="dlgDispose.visible=false">提交处置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 让 Element 表格在深色主题更柔和 */
:deep(.el-table__header-wrapper){ background: transparent; }
</style>
