<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  validateFeatureMock,
  exampleFeature,
  exampleSeries,
  exampleMethods
} from '@/mock/featureValidation.mock'

/**
 * ✅ 所有入参都变为“可选”
 * - 不传时，组件内部自动使用 mock：exampleFeature / exampleSeries / exampleMethods
 * - 有真实数据时，可以按需覆盖（仍兼容）
 */
const props = defineProps({
  featureName: { type: String, default: '' },
  featureValue: { type: [Number, String], default: null },
  series: { type: Array, default: () => [] },
  methods: { type: Array, default: () => [] },
  title: { type: String, default: '特征检验' },
  /** 默认开启：没有真实数据时自动跑一遍，UI立即有结果 */
  autorun: { type: Boolean, default: true }
})
const emit = defineEmits(['validated', 'update:methods'])

/* ---------------- 本地状态（优先用 props，否则用 mock） ---------------- */
const name = ref(props.featureName || exampleFeature)
const value = ref(
    props.featureValue != null ? Number(props.featureValue) : Number(exampleSeries.at(-1))
)
const seriesLocal = ref(
    (props.series && props.series.length ? props.series : exampleSeries).slice()
)
const localMethods = ref(
    props.methods && props.methods.length ? deepClone(props.methods) : deepClone(exampleMethods)
)

const running = ref(false)
const results = ref([])

/* ---------------- 统一数值序列 + 统计 ---------------- */
const numericSeries = computed(() =>
    seriesLocal.value
        .map(d => (typeof d === 'number' ? d : (d?.feature_value ?? d?.value)))
        .filter(v => Number.isFinite(v))
)
const stats = computed(() => {
  const arr = numericSeries.value
  if (!arr.length) return null
  const sorted = [...arr].sort((a, b) => a - b)
  const mean = arr.reduce((s, x) => s + x, 0) / arr.length
  const sd = Math.sqrt(arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length)
  const qAt = p => {
    const i = (sorted.length - 1) * p
    const lo = Math.floor(i), hi = Math.ceil(i)
    if (lo === hi) return sorted[lo]
    const t = i - lo
    return sorted[lo] * (1 - t) + sorted[hi] * t
  }
  const q1 = qAt(0.25), q3 = qAt(0.75)
  const iqr = q3 - q1
  return { count: arr.length, min: sorted[0], max: sorted.at(-1), mean, sd, q1, q3, iqr }
})

const ready = computed(() =>
    !!name.value && Number.isFinite(Number(value.value)) && localMethods.value.length > 0
)

/* ---------------- 执行检验（使用 mock） ---------------- */
async function runValidation () {
  if (!ready.value) return
  running.value = true
  try {
    const res = await validateFeatureMock({
      featureName: name.value,
      value: Number(value.value),
      series: numericSeries.value,
      methods: localMethods.value
    })
    results.value = res.results || []
    emit('validated', res)
  } finally {
    running.value = false
  }
}

/* ---------------- 方法编辑 ---------------- */
function addMethod (t) {
  if (t === 'ZScore') localMethods.value.push({ type: 'ZScore', params: { threshold: 3 } })
  else if (t === 'IQR') localMethods.value.push({ type: 'IQR', params: { k: 1.5 } })
  else if (t === 'Range') localMethods.value.push({ type: 'Range', params: { min: 0, max: 1 } })
  emit('update:methods', deepClone(localMethods.value))
}
function removeMethod (i) {
  localMethods.value.splice(i, 1)
  emit('update:methods', deepClone(localMethods.value))
}

/* ---------------- props 有传就覆盖（仍兼容外部传值） ---------------- */
watch(() => props.featureName, v => { if (v) name.value = v })
watch(() => props.featureValue, v => {
  if (v != null && Number.isFinite(Number(v))) value.value = Number(v)
})
watch(() => props.series, v => {
  if (Array.isArray(v) && v.length) seriesLocal.value = v.slice()
})
watch(() => props.methods, v => {
  if (Array.isArray(v) && v.length) localMethods.value = deepClone(v)
})

/* ---------------- 自动运行：无数据时直接用 mock 出效果 ---------------- */
onMounted(() => {
  if (!props.autorun) return
  if (!name.value) name.value = exampleFeature
  if (!(value.value != null && Number.isFinite(Number(value.value)))) {
    value.value = Number(exampleSeries.at(-1))
  }
  if (!numericSeries.value.length) {
    seriesLocal.value = exampleSeries.slice()
  }
  if (!localMethods.value.length) {
    localMethods.value = deepClone(exampleMethods)
  }
  // 下一帧执行，确保 UI 已渲染
  queueMicrotask(runValidation)
})

/* ---------------- 工具 ---------------- */
function deepClone (x) { return JSON.parse(JSON.stringify(x ?? null)) }
</script>

<template>
  <div class="space-y-3 text-neutral-900 dark:text-neutral-100">
    <!-- 标题 -->
    <div class="flex items-center gap-2">
      <span class="inline-block w-1.5 h-4 rounded bg-[color:var(--primary-color)]"></span>
      <div class="font-medium">{{ title }}</div>
    </div>

    <!-- 行：特征名 / 当前值 / 执行 -->
    <div class="grid grid-cols-12 gap-3 items-end">
      <div class="col-span-12 sm:col-span-4">
        <div class="text-xs opacity-70 mb-1">特征名</div>
        <el-input v-model="name" placeholder="输入或选择特征名" />
      </div>
      <div class="col-span-12 sm:col-span-4">
        <div class="text-xs opacity-70 mb-1">当前值</div>
        <el-input-number v-model="value" :controls="false" :precision="6" class="w-full" />
      </div>
      <div class="col-span-12 sm:col-span-4">
        <div class="text-xs opacity-70 mb-1">操作</div>
        <el-button type="primary" class="min-w-[96px]" :disabled="!ready" :loading="running" @click="runValidation">
          执行检验
        </el-button>
      </div>
    </div>

    <!-- 基线统计 -->
    <div class="rounded border border-neutral-200 dark:border-neutral-700 p-3 bg-white dark:bg-neutral-900">
      <div class="text-xs opacity-70 mb-2">基线统计（用于 ZScore / IQR）</div>
      <div v-if="stats" class="grid grid-cols-6 gap-3 text-sm">
        <div>样本数 <span class="font-medium">{{ stats.count }}</span></div>
        <div>均值 <span class="font-medium">{{ stats.mean.toFixed(4) }}</span></div>
        <div>标准差 <span class="font-medium">{{ stats.sd.toFixed(4) }}</span></div>
        <div>Q1 <span class="font-medium">{{ stats.q1.toFixed(4) }}</span></div>
        <div>Q3 <span class="font-medium">{{ stats.q3.toFixed(4) }}</span></div>
        <div>IQR <span class="font-medium">{{ stats.iqr.toFixed(4) }}</span></div>
      </div>
      <div v-else class="text-xs opacity-60">* 未提供基线序列，将仅按参数检验；建议传入近期样本以提升鲁棒性。</div>
    </div>

    <!-- 方法配置 -->
    <el-card shadow="never" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
      <div class="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <div class="font-medium">检验方法</div>
        <el-dropdown @command="addMethod">
          <el-button size="small">新增方法</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="ZScore">ZScore 阈值</el-dropdown-item>
              <el-dropdown-item command="IQR">IQR 离群</el-dropdown-item>
              <el-dropdown-item command="Range">数值范围</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="p-3 space-y-3">
        <div v-for="(m, idx) in localMethods" :key="idx"
             class="grid grid-cols-12 gap-3 items-end rounded border border-neutral-200 dark:border-neutral-700 p-3">
          <div class="col-span-12 sm:col-span-3">
            <div class="text-xs opacity-70 mb-1">方法</div>
            <el-tag size="small" :type="m.type==='ZScore'?'':(m.type==='IQR'?'warning':'info')">{{ m.type }}</el-tag>
          </div>

          <template v-if="m.type==='ZScore'">
            <div class="col-span-12 sm:col-span-3">
              <div class="text-xs opacity-70 mb-1">阈值（|z| ≤）</div>
              <el-input-number v-model="m.params.threshold" :min="0.1" :step="0.1" :precision="2" class="w-full" />
            </div>
          </template>

          <template v-else-if="m.type==='IQR'">
            <div class="col-span-12 sm:col-span-3">
              <div class="text-xs opacity-70 mb-1">k 倍 IQR</div>
              <el-input-number v-model="m.params.k" :min="0.1" :step="0.1" :precision="2" class="w-full" />
            </div>
          </template>

          <template v-else-if="m.type==='Range'">
            <div class="col-span-6 sm:col-span-3">
              <div class="text-xs opacity-70 mb-1">最小值</div>
              <el-input-number v-model="m.params.min" :step="0.1" class="w-full" />
            </div>
            <div class="col-span-6 sm:col-span-3">
              <div class="text-xs opacity-70 mb-1">最大值</div>
              <el-input-number v-model="m.params.max" :step="0.1" class="w-full" />
            </div>
          </template>

          <div class="col-span-12 sm:col-span-3 flex justify-end">
            <el-button type="danger" plain size="small" @click="removeMethod(idx)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 结果表 -->
    <div class="rounded border border-neutral-200 dark:border-neutral-700 p-3 bg-white dark:bg-neutral-900">
      <div class="font-medium mb-2">检验结果</div>
      <el-table :data="results" size="small" class="!bg-transparent">
        <el-table-column label="方法" prop="method" width="120" />
        <el-table-column label="计算值/区间" min-width="220">
          <template #default="{ row }">
            <template v-if="row.method==='ZScore'">
              |z| = {{ row.value?.toFixed?.(4) }}（阈值 ≤ {{ row.threshold }}）
            </template>
            <template v-else-if="row.method==='IQR'">
              区间 [{{ row.lower?.toFixed?.(4) }}, {{ row.upper?.toFixed?.(4) }}]
            </template>
            <template v-else-if="row.method==='Range'">
              区间 [{{ row.min }}, {{ row.max }}]
            </template>
          </template>
        </el-table-column>
        <el-table-column label="是否通过" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
              {{ row.passed ? '通过' : '不通过' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="results?.length" class="mt-3 text-xs opacity-70">
        当前值：<span class="font-medium">{{ value }}</span>；不通过的数据将被过滤，不参与诊断/预测/建模。
      </div>
    </div>
  </div>
</template>

<style scoped>
:root { --primary-color: #165DFF; }
</style>
