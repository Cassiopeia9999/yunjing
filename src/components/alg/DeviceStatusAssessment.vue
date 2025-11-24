<template>
  <div>
    <!-- 触发弹窗的按钮 -->
    <el-button
        :size="buttonSize"
        :type="buttonType"
        :icon="buttonIcon"
        @click="assessmentDialog = true"
        :disabled="disabled"
    >
      {{ buttonText }}
    </el-button>

    <!-- 设备状态评估弹窗：将宽度从500px调整为700px -->
    <el-dialog
        v-model="assessmentDialog"
        title="设备状态评估"
        width="900px"
    :close-on-click-modal="false"
    >
    <!-- 弹窗内部内容保持不变 -->
    <div class="space-y-4">
      <!-- 设备信息展示 -->
      <el-card shadow="never" class="dark:bg-neutral-800">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-medium">{{ deviceInfo.device_name || '未知设备' }}</div>
            <div class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              编号: {{ deviceInfo.component_code || 'N/A' }}
            </div>
          </div>
          <el-tag :type="statusType">{{ statusLabel }}</el-tag>
        </div>
      </el-card>

      <!-- 评估时间窗口选择 -->
      <div>
        <el-form-item label="选择评估时间窗口" label-width="140px">
          <el-select
              v-model="selectedWindowSize"
              placeholder="请选择时间窗口"
              class="w-full"
          >
            <el-option label="7天" value="7"></el-option>
            <el-option label="30天" value="30"></el-option>
            <el-option label="90天" value="90"></el-option>
            <el-option label="180天" value="180"></el-option>
            <el-option label="365天" value="365"></el-option>
          </el-select>
        </el-form-item>
      </div>

      <!-- 特征数据预览 -->
      <div v-if="featureAll.length">
        <el-form-item label="特征数据预览" label-width="140px">
          <el-table
              :data="featurePreview"
              size="small"
              border
              class="w-full"
              max-height="150"
          >
            <el-table-column prop="name" label="特征名称" width="120"></el-table-column>
            <el-table-column prop="value" label="值"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
          </el-table>
          <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            共 {{ featureAll.length }} 项特征数据
          </div>
        </el-form-item>
      </div>


      <!-- 评估结果展示 -->
      <div v-if="assessmentResult" class="border rounded-lg p-3 bg-neutral-50 dark:bg-neutral-800">
        <h4 class="font-medium mb-2">评估结果</h4>
        <el-descriptions column="1" border>
          <el-descriptions-item label="评估时间">
            {{ new Date().toLocaleString() }} <!-- 若服务无时间，展示当前时间 -->
          </el-descriptions-item>
          <el-descriptions-item label="剩余寿命">
            <div class="flex flex-col gap-1">
              <span>{{ assessmentResult.lifetime }} 天</span>
              <el-progress
                  :percentage="100 - (assessmentResult.lifetime / 365 * 100)"
                  :stroke-width="6"
                  :status="assessmentResult.lifetime < 90 ? 'danger' :
                  assessmentResult.lifetime < 180 ? 'warning' : 'success'"
              />
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="评估置信度">
            <div class="flex flex-col gap-1">
              <span>{{ assessmentResult.confidence }}%</span>
              <el-progress
                  :percentage="assessmentResult.confidence"
                  :stroke-width="6"
                  :status="assessmentResult.confidence >= 80 ? 'success' :
                  assessmentResult.confidence >= 60 ? 'warning' : 'danger'"
              />
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="评估说明">
            {{ assessmentResult.message || '无说明' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 加载状态 -->
      <div v-if="assessing" class="flex flex-col items-center py-6">
        <el-loading-spinner size="large"></el-loading-spinner>
        <p class="mt-3 text-neutral-500 dark:text-neutral-400">正在执行设备状态评估，请稍候...</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="text-red-500 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
        <el-icon><warning-filled /></el-icon>
        {{ errorMessage }}
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
          type="primary"
          :loading="assessing"
          @click="executeAssessment"
      >
        执行评估
      </el-button>
    </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled, CircleCheck } from '@element-plus/icons-vue'
import { commonServiceClient } from '@/api/common_service_client.js'

// 组件属性
const props = defineProps({
  // 设备信息，必传
  deviceInfo: {
    type: Object,
    required: true,
    default: () => ({})
  },
  // 按钮文本
  buttonText: {
    type: String,
    default: '设备状态评估'
  },
  // 按钮尺寸
  buttonSize: {
    type: String,
    default: 'large'
  },
  // 按钮类型
  buttonType: {
    type: String,
    default: 'primary'
  },
  // 按钮图标
  buttonIcon: {
    type: Object,
    default: () => CircleCheck
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  }
})

// 组件事件
const emit = defineEmits(['complete', 'error', 'cancel'])

// 状态管理
const assessmentDialog = ref(false) // 弹窗显隐
const selectedWindowSize = ref(30) // 时间窗口选择
const assessing = ref(false) // 评估中状态
const assessmentResult = ref(null) // 评估结果
const errorMessage = ref('') // 错误信息
const featureAll = ref([]) // 全量特征数据

// 设备状态映射
const STATUS_MAP = {
  '1': { label: '正常', type: 'success' },
  '2': { label: '预警', type: 'warning' },
  '3': { label: '故障', type: 'danger' },
  '4': { label: '停用', type: 'info' },
  default: { label: '未知', type: 'info' }
}

// 计算属性
const statusInfo = computed(() => {
  const key = String(props.deviceInfo.status ?? '')
  return STATUS_MAP[key] || STATUS_MAP.default
})

const statusLabel = computed(() => statusInfo.value.label)
const statusType = computed(() => statusInfo.value.type)

// 特征数据预览（最多显示5条）
const featurePreview = computed(() => {
  return featureAll.value.slice(0, 5)
})

// 生命周期
onMounted(async () => {
  // 组件挂载时加载特征数据
  await loadFeatures()
})

// 方法
// 加载设备特征数据
async function loadFeatures() {
  try {
    if (!props.deviceInfo.id) return

    // 实际项目中这里应该调用真实的特征数据接口
    // 这里使用模拟数据
    const mockFeatures = [
      { name: 'rms', value: '0.0234', unit: 'mm/s', source: 'parsed', ts: new Date().toISOString() },
      { name: 'kurtosis', value: '3.21', unit: '', source: 'parsed', ts: new Date().toISOString() },
      { name: 'crest_factor', value: '5.67', unit: '', source: 'parsed', ts: new Date().toISOString() },
      { name: 'peak', value: '0.124', unit: 'mm/s', source: 'parsed', ts: new Date().toISOString() },
      { name: 'impulse_index', value: '8.92', unit: '', source: 'parsed', ts: new Date().toISOString() },
      { name: 'cwt_energy', value: '1245', unit: 'a.u.', source: 'parsed', ts: new Date().toISOString() }
    ]

    featureAll.value = mockFeatures
  } catch (error) {
    console.error('加载特征数据失败:', error)
    errorMessage.value = '加载特征数据失败，请稍后重试'
  }
}

// 执行设备状态评估
async function executeAssessment() {
  // 重置状态
  errorMessage.value = ''
  assessmentResult.value = null

  // 验证参数
  if (!props.deviceInfo.id) {
    errorMessage.value = '设备ID缺失，无法执行评估'
    return
  }

  if (!featureAll.value.length) {
    errorMessage.value = '未获取到设备特征数据，无法执行评估'
    return
  }

  try {
    assessing.value = true

    // 构造请求参数（与服务端参数名对齐）
    const params = {
      window_size: selectedWindowSize.value,
      features: featureAll.value.map(feat => ({
        name: feat.name,
        value: feat.value,
        unit: feat.unit,
        source: feat.source,
        timestamp: feat.ts
      })),
      device_info: {
        id: props.deviceInfo.id,
        name: props.deviceInfo.device_name || `设备-${props.deviceInfo.id}`,
        componentCode: props.deviceInfo.component_code || '',
        manufacturer: props.deviceInfo.manufacturer || '',
        status: props.deviceInfo.status || ''
      }
    };

    // 调用后端服务（服务标识需与服务端注册一致，假设为"PREDICT_DEVICE_LIFETIME"）
    const response = await commonServiceClient.invoke("PREDICT_DEVICE_LIFETIME", params);

    // 解析服务端返回的结果（需判断success字段）
    if (response.data && response.data.success) {
      const result = response.data.result;
      assessmentResult.value = {
        lifetime: result.lifetime,       // 寿命（天）
        confidence: result.confidence,   // 置信度（%）
        message: result.message || '无说明'
      };

      // 触发完成事件，将结果传递给父组件
      emit('complete', assessmentResult.value)
    } else {
      throw new Error(response.data?.message || '评估请求失败（服务端success为false）')
    }
  } catch (error) {
    console.error('设备寿命评估失败:', error);
    errorMessage.value = `评估失败：${error.message || '未知错误'}`;
    emit('error', error)
  } finally {
    assessing.value = false;
  }
}
// 获取评级对应的标签类型
function getRatingType(rating) {
  switch(rating) {
    case 'A': return 'success'
    case 'B': return 'primary'
    case 'C': return 'warning'
    case 'D': return 'danger'
    default: return 'info'
  }
}

// 取消操作
function handleCancel() {
  assessmentDialog.value = false
  emit('cancel')
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>

<style scoped>
:deep(.el-progress-bar__innerText) {
  color: #fff !important;
}

:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.el-form-item__content) {
  line-height: 1;
}
</style>