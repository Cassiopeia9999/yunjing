<template>
  <div class="flex flex-col h-full min-h-[60vh] text-neutral-900 dark:text-neutral-100">
    <!-- 顶部条：渐变 + 输入 + 操作 -->
    <div
        class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-gradient-to-r
             from-indigo-50 via-sky-50 to-violet-50 dark:from-indigo-950/40 dark:via-sky-950/30 dark:to-violet-950/30
             p-3 mb-3"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs mb-2">
        <span class="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-indigo-600 text-white shadow-sm">
          <span class="w-2 h-2 rounded-full bg-white/80"></span> 任务评估
        </span>
        <span class="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          基地：Lat {{ baseLatNum.toFixed(6) }} · Lon {{ baseLonNum.toFixed(6) }}
        </span>
        <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
          规则：ETA×2 ≤ 健康寿命(小时)
        </span>
      </div>

      <div class="grid grid-cols-12 gap-3 items-end">
        <div class="col-span-12 sm:col-span-3">
          <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">目标纬度</div>
          <el-input v-model="inputLat" placeholder="例如：39.9042" />
        </div>
        <div class="col-span-12 sm:col-span-3">
          <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">目标经度</div>
          <el-input v-model="inputLon" placeholder="例如：116.4074" />
        </div>

        <div class="col-span-12 sm:col-span-3">
          <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">筛选</div>
          <div class="flex items-center gap-3">
            <el-switch v-model="onlyReachable" active-text="仅可达" />
            <el-switch v-model="hideNoSpeed" active-text="隐藏无速度" />
          </div>
        </div>

        <div class="col-span-12 sm:col-span-3 flex gap-2">
          <el-button type="primary" class="flex-1" :loading="running" @click="evaluateAll">评估</el-button>
          <el-button class="flex-1" @click="resetForm">清空</el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      <div class="rounded-lg p-3 border border-indigo-200 dark:border-indigo-900
                  bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-neutral-900">
        <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300">装置总数</div>
        <div class="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">{{ stats.total }}</div>
      </div>
      <div class="rounded-lg p-3 border border-emerald-200 dark:border-emerald-900
                  bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-neutral-900">
        <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300">可达</div>
        <div class="text-2xl font-semibold text-emerald-600 dark:text-emerald-300">{{ stats.reachable }}</div>
      </div>
      <div class="rounded-lg p-3 border border-rose-200 dark:border-rose-900
                  bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-neutral-900">
        <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300">不可达</div>
        <div class="text-2xl font-semibold text-rose-600 dark:text-rose-300">{{ stats.unreachable }}</div>
      </div>
      <div class="rounded-lg p-3 border border-amber-200 dark:border-amber-900
                  bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-neutral-900">
        <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300">平均 ETA</div>
        <div class="text-2xl font-semibold text-amber-600 dark:text-amber-300">
          {{ stats.avgEta > 0 ? stats.avgEta.toFixed(1) + 'h' : '—' }}
        </div>
      </div>
    </div>

    <!-- 结果表格 -->
    <div class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex-1 min-h-0">
      <div class="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="inline-block w-1.5 h-4 rounded bg-indigo-500"></span>
          <div class="font-medium">评估结果（{{ filteredRows.length }}）</div>
        </div>
        <div class="flex items-center gap-2">
          <el-button size="small" @click="exportCSV" :disabled="!rows.length">导出 CSV</el-button>
        </div>
      </div>

      <el-table
          :data="filteredRows"
          height="100%"
          border
          fit
          size="small"
          class="!bg-transparent"
          :default-sort="{ prop: 'reachable', order: 'descending' }"
      >
        <el-table-column label="装置" min-width="160">
          <template #default="{row}">
            <div class="flex items-center gap-2">
              <span class="truncate" :title="row.name">{{ row.name }}</span>
              <el-tag size="small" :type="row.status==='Fault'?'danger':row.status==='Warning'?'warning':'success'">
                {{ row.status }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="speedKn" label="航速(节)" width="90">
          <template #default="{row}">{{ row.speedKn ?? '—' }}</template>
        </el-table-column>

        <el-table-column prop="distanceKm" label="距离(km)" width="110" sortable>
          <template #default="{row}">{{ row.distanceKm?.toFixed?.(1) ?? '—' }}</template>
        </el-table-column>

        <el-table-column prop="etaHour" label="ETA(h)" width="96" sortable>
          <template #default="{row}">{{ row.etaHour?.toFixed?.(1) ?? '—' }}</template>
        </el-table-column>

        <el-table-column prop="lifeDay" label="健康寿命(天)" width="120" sortable>
          <template #default="{row}">{{ row.lifeDay ?? '—' }}</template>
        </el-table-column>

        <el-table-column prop="marginHour" label="裕度(h)" width="100" sortable>
          <template #default="{row}">
            <span :class="row.marginHour != null && row.marginHour >= 0 ? 'text-emerald-600' : 'text-rose-500'">
              {{ row.marginHour != null ? row.marginHour.toFixed(1) : '—' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="reachable" label="判定" width="120" sortable>
          <template #default="{row}">
            <el-tag v-if="row.reachable" size="small" type="success">可达</el-tag>
            <el-tag v-else size="small" type="danger">不可达</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type Device = {
  name: string
  status: 'Normal' | 'Warning' | 'Fault' | string
  sailing_speed: number | null  // 节(kn)
  nextMaintenance: number | null // 天
}

const props = defineProps<{
  devices: Device[]
  baseLat: string | number
  baseLon: string | number
}>()

/** ---- 输入与 UI 状态 ---- */
const inputLat = ref<string>('')       // 用户输入的目标纬度
const inputLon = ref<string>('')       // 用户输入的目标经度
const onlyReachable = ref(false)
const hideNoSpeed   = ref(false)
const running = ref(false)

/** 解析为 number 方便计算 */
const baseLatNum = computed(() => Number(props.baseLat) || 0)
const baseLonNum = computed(() => Number(props.baseLon) || 0)

/** ---- 结果行 ---- */
type Row = {
  name: string
  status: Device['status']
  speedKn: number | null
  distanceKm: number | null
  etaHour: number | null
  lifeDay: number | null
  marginHour: number | null
  reachable: boolean
}
const rows = ref<Row[]>([])

/** 评估核心 */
function evaluateAll() {
  rows.value = []
  running.value = true
  try {
    const lat = Number(inputLat.value)
    const lon = Number(inputLon.value)
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      // 简易校验
      rows.value = []
      running.value = false
      return
    }

    const R = 6371 // km
    const toRad = (d: number) => (d * Math.PI) / 180

    props.devices.forEach(d => {
      // 距离
      const dLat = toRad(lat - baseLatNum.value)
      const dLon = toRad(lon - baseLonNum.value)
      const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(baseLatNum.value)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c

      // ETA
      const kn = d.sailing_speed ?? null
      const kmh = kn != null && kn > 0 ? kn * 1.852 : null
      const eta = kmh ? (distance / kmh) : null

      // 可达性（ETA×2 ≤ 寿命小时）
      const lifeDay = d.nextMaintenance ?? null
      const lifeHour = lifeDay != null ? lifeDay * 24 : null
      const needHour = eta != null ? eta * 2 : null
      const margin = lifeHour != null && needHour != null ? (lifeHour - needHour) : null
      const reachable = margin != null ? margin >= 0 : false

      rows.value.push({
        name: d.name,
        status: d.status,
        speedKn: kn,
        distanceKm: distance,
        etaHour: eta,
        lifeDay,
        marginHour: margin,
        reachable
      })
    })
  } finally {
    running.value = false
  }
}

/** 过滤视图 */
const filteredRows = computed(() => {
  let list = rows.value.slice()
  if (hideNoSpeed.value) list = list.filter(r => r.speedKn != null && r.speedKn > 0)
  if (onlyReachable.value) list = list.filter(r => r.reachable)
  return list
})

/** 统计 */
const stats = computed(() => {
  const all = filteredRows.value
  const total = all.length
  const reach = all.filter(r => r.reachable).length
  const unreach = total - reach
  const avgEta =
      all.map(r => r.etaHour ?? 0).filter(v => v > 0).reduce((a, b) => a + b, 0) /
      Math.max(1, all.filter(r => (r.etaHour ?? 0) > 0).length)
  return { total, reachable: reach, unreachable: unreach, avgEta: avgEta || 0 }
})

/** CSV 导出 */
function exportCSV() {
  if (!rows.value.length) return
  const header = ['device', 'status', 'speed_kn', 'distance_km', 'eta_h', 'life_day', 'margin_h', 'reachable']
  const lines = rows.value.map(r =>
      [r.name, r.status, r.speedKn ?? '', r.distanceKm?.toFixed?.(2) ?? '', r.etaHour?.toFixed?.(2) ?? '',
        r.lifeDay ?? '', r.marginHour?.toFixed?.(2) ?? '', r.reachable ? 'yes' : 'no'].join(',')
  )
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `device_assessment_${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

/** 清空 */
function resetForm() {
  inputLat.value = ''
  inputLon.value = ''
  rows.value = []
}
</script>

<style scoped>
/* 表格头背景跟随父容器，深色更协调 */
:deep(.el-table){
  --el-table-header-bg-color: transparent;
}
/* Tabs/表格在弹窗中自适应高度的通用处理（若外层对话框也用 flex） */
:deep(.el-dialog__body){
  overflow: hidden;
}
</style>
