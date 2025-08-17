<script setup>
import { computed, ref, watch } from 'vue'
import { classifyStatusMock } from '@/mock/statusClassifier.mock'

// props：当前设备“单点”的特征集合
const props = defineProps({
  features: { type: Array, default: () => [] },
  defaultX: String,
  defaultY: String,
  title: { type: String, default: '状态甄别' },
  autorun: { type: Boolean, default: false } // ← 新增
})

const emit = defineEmits(['classified']) // 回传识别结果

/* 可选轴 */
const featureNames = computed(() => (props.features || []).map(f => f.name))

/* 轴选择 */
const xKey = ref(props.defaultX || featureNames.value[0] || '')
const yKey = ref(props.defaultY || featureNames.value[1] || '')

/* 当前坐标与结果 */
const xVal = ref(null)
const yVal = ref(null)
const resultObj = ref(null)
const loading = ref(false)

const isReady = computed(() => !!xKey.value && !!yKey.value && xKey.value !== yKey.value)

/* 根据选择映射 X/Y 数值 */
function computeXY () {
  const map = new Map((props.features || []).map(i => [i.name, i.value]))
  xVal.value = map.get(xKey.value)
  yVal.value = map.get(yKey.value)
  resultObj.value = null
}

/* 触发识别（调用 mock，可替换为真实接口） */
async function runClassify () {
  if (!isReady.value) return
  loading.value = true
  try {
    const res = await classifyStatusMock({
      features: props.features,
      xKey: xKey.value,
      yKey: yKey.value
    })
    resultObj.value = res
    emit('classified', res) // { time, x, y, result, scores, xKey, yKey }
  } finally {
    loading.value = false
  }
}

/* 联动：features 或默认轴变化时，重算 XY */
watch(() => props.features, () => {
  computeXY()
  // 新增：自动运行
  if (props.autorun && isReady.value) runClassify()
}, { immediate: true })
watch([xKey, yKey], computeXY)
</script>

<template>
  <div class="space-y-3 text-neutral-900 dark:text-neutral-100">
    <!-- 标题 -->
    <div class="flex items-center gap-2">
      <span class="inline-block w-1.5 h-4 rounded bg-[color:var(--primary-color)]"></span>
      <div class="font-medium">{{ title }}</div>
    </div>

    <!-- 轴映射 & 识别 -->
    <div class="grid grid-cols-12 gap-3 items-end">
      <div class="col-span-12 sm:col-span-5">
        <div class="text-xs opacity-70 mb-1">X 轴特征</div>
        <el-select v-model="xKey" filterable placeholder="选择特征（X）" class="w-full">
          <el-option v-for="n in featureNames" :key="n" :value="n" :label="n" />
        </el-select>
      </div>
      <div class="col-span-12 sm:col-span-5">
        <div class="text-xs opacity-70 mb-1">Y 轴特征</div>
        <el-select v-model="yKey" filterable placeholder="选择特征（Y）" class="w-full">
          <el-option v-for="n in featureNames" :key="n" :value="n" :label="n" />
        </el-select>
      </div>
      <div class="col-span-12 sm:col-span-2">
        <el-button type="primary" :disabled="!isReady" :loading="loading" class="w-full" @click="runClassify">
          识别
        </el-button>
      </div>
    </div>

    <!-- 当前坐标 -->
    <div class="rounded border border-neutral-200 dark:border-neutral-700 p-3 bg-white dark:bg-neutral-900">
      <div class="text-xs opacity-70 mb-2">当前坐标</div>
      <div class="flex gap-6 text-sm">
        <div>X={{ xVal ?? '—' }}（{{ xKey || '未选择' }}）</div>
        <div>Y={{ yVal ?? '—' }}（{{ yKey || '未选择' }}）</div>
      </div>
    </div>

    <!-- 识别结果 -->
    <div v-if="resultObj" class="rounded border border-neutral-200 dark:border-neutral-700 p-3 bg-white dark:bg-neutral-900">
      <div class="flex items-center gap-2 mb-2">
        <div class="text-xs opacity-70">识别结果</div>
        <el-tag
            :type="resultObj.result==='Fault' ? 'danger' : (resultObj.result==='Warning' ? 'warning' : 'success')"
            size="small"
        >{{ resultObj.result }}</el-tag>
        <div class="text-xs opacity-70">时间：{{ resultObj.time.replace('T',' ').slice(0,19) }}</div>
      </div>
      <div class="text-xs opacity-70 mb-1">置信度（mock）：</div>
      <div class="flex flex-wrap gap-2">
        <el-tag size="small" effect="plain">Normal {{ Math.round(resultObj.scores.Normal*100) }}%</el-tag>
        <el-tag size="small" effect="plain" type="warning">Warning {{ Math.round(resultObj.scores.Warning*100) }}%</el-tag>
        <el-tag size="small" effect="plain" type="danger">Fault {{ Math.round(resultObj.scores.Fault*100) }}%</el-tag>
      </div>
    </div>

    <div v-else class="text-xs opacity-60">* 选择好两个特征后点击“识别”即可得到结果；此组件不含对话框。</div>
  </div>
</template>

<style scoped>
:root { --primary-color: #165DFF; }
</style>
