<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { loadFeaturePanelCfg, saveFeaturePanelCfg } from '@/utils/featurePanelCfg'  // ← 新增

const props = defineProps({
  visible:       { type: Boolean, default: false },
  deviceId:      { type: [String, Number], required: true },
  features:      { type: Array,  default: () => [] },
  defaultCount:  { type: Number, default: 8 },
  makeKey:       { type: Function, default: (f)=>`${f.name}|${f.source||''}` },
  maxCount:      { type: Number, default: 24 },
})
const emit = defineEmits(['update:visible', 'apply'])

const localOrder = ref([])
const localCount = ref(props.defaultCount)

// 打开时同步
watch(() => props.visible, (v)=>{
  if(!v) return
  const validKeys = new Set(props.features.map(props.makeKey))
  const saved = loadFeaturePanelCfg(props.deviceId)   // ← 使用工具函数

  const baseOrder = (saved?.order || []).filter(k => validKeys.has(k))
  const newOnes = props.features.map(props.makeKey).filter(k => !baseOrder.includes(k))
  localOrder.value = [...baseOrder, ...newOnes]
  localCount.value = saved?.count ?? props.defaultCount ?? 8
}, { immediate:true })

const rows = computed(()=> localOrder.value
    .map(k => props.features.find(f => props.makeKey(f) === k))
    .filter(Boolean)
)

function moveUp(i){ if(i<=0) return; const a=localOrder.value; [a[i-1],a[i]]=[a[i],a[i-1]] }
function moveDown(i){ const a=localOrder.value; if(i>=a.length-1) return; [a[i+1],a[i]]=[a[i],a[i+1]] }
function moveTop(i){ const a=localOrder.value; const [x]=a.splice(i,1); a.unshift(x) }

function close(){ emit('update:visible', false) }
function save(){
  const count = Math.max(1, Math.min(props.maxCount, Number(localCount.value)||8))
  const cfg = { order:[...localOrder.value], count }
  saveFeaturePanelCfg(props.deviceId, cfg)           // ← 使用工具函数
  ElMessage.success('特征面板配置已保存')
  emit('apply', cfg)                                 // 通知父级立即生效
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog :model-value="visible" title="最新特征值（配置）" width="720px" @close="close">
    <div class="mb-3 flex items-center gap-4">
      <span class="text-sm opacity-80">面板显示数量：</span>
      <el-input-number v-model="localCount" :min="1" :max="maxCount" size="small" />
      <span class="text-xs opacity-60">（保存后，面板显示前 N 个）</span>
    </div>

    <el-table :data="rows" size="small" class="!bg-transparent">
      <el-table-column label="#" width="60" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column prop="name" label="特征名称" min-width="180" />
      <el-table-column label="值" width="180">
        <template #default="{ row }">
          {{ typeof row.value === 'number' ? (+row.value.toFixed(3)) : row.value }} {{ row.unit }}
        </template>
      </el-table-column>
      <el-table-column label="来源" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="row.source==='raw'?'primary':'success'" effect="plain">
            {{ row.source==='raw'?'解析':'上报' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center">
        <template #default="{ $index }">
          <el-button size="small" @click="moveTop($index)"  :disabled="$index===0">置顶</el-button>
          <el-button size="small" @click="moveUp($index)"   :disabled="$index===0">上移</el-button>
          <el-button size="small" @click="moveDown($index)" :disabled="$index===rows.length-1">下移</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
