<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" v-if="isModalOpen">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
      <div class="p-4 border-b">
        <h3 class="text-lg font-semibold text-gray-800">装置任务评估</h3>
      </div>

      <!-- 起始点信息 -->
      <div class="p-4 border-b">
        <h4 class="font-medium text-gray-700 mb-2">起始点 (基地)</h4>
        <div class="grid grid-cols-2 gap-2 text-black">
          <div>
            <span class="text-sm text-gray-500">纬度:</span>
            <span class="ml-1 font-medium">{{ parseFloat(props.baseLat).toFixed(6) }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">经度:</span>
            <span class="ml-1 font-medium">{{ parseFloat(props.baseLon).toFixed(6) }}</span>
          </div>
        </div>
      </div>

      <!-- 装置选择 -->
      <div class="p-4 border-b">
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">选择装置</label>
          <el-select
              v-model="selectedDeviceName"
              placeholder="请选择装置"
              class="w-full"
              @change="onDeviceChange"
          >
            <el-option
                v-for="device in devices"
                :key="device.name"
                :label="`${device.name} (${device.status})`"
                :value="device.name"
            />
          </el-select>
        </div>

        <!-- 显示装置速度 -->
        <div v-if="selectedDevice" class="pt-2">
          <span class="text-sm text-gray-500">航行速度:</span>
          <span
              class="ml-1 font-medium text-black"
              :class="{'text-red-500': !isDeviceReachable}"
          >
            {{
              selectedDevice && selectedDevice.sailing_speed !== null
                  ? selectedDevice.sailing_speed + ' 节'
                  : '不可用'
            }}
          </span>
        </div>
      </div>

      <!-- 目标经纬度 -->
      <div class="p-4 border-b">
        <h4 class="font-medium text-gray-700 mb-2">目标位置</h4>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">纬度</label>
            <el-input
                type="number"
                step="0.000001"
                placeholder="例如：39.9042"
                v-model="inputLat"
                class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">经度</label>
            <el-input
                type="number"
                step="0.000001"
                placeholder="例如：116.4074"
                v-model="inputLon"
                class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- 按钮区域 -->
      <div class="p-4 flex justify-center gap-3">
        <el-button
            type="primary"
            @click="calculateDistance"
            :disabled="!selectedDevice || !inputLat || !inputLon"
        >
          评估
        </el-button>
        <el-button
            type="default"
            @click="closeModal"
        >
          取消
        </el-button>
      </div>

      <!-- 结果显示 -->
      <div v-if="result" class="p-4 border-t text-center">
        <p class="text-sm font-medium text-green-600">
          {{ result }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, onMounted } from 'vue'
import { ElSelect, ElOption, ElInput, ElButton } from 'element-plus'

// 定义组件接收的属性
const props = defineProps({
  devices: {
    type: Array,
    default: () => []
  },
  baseLat: {
    type: String,
    default: ''
  },
  baseLon: {
    type: String,
    default: ''
  }
})

// 定义组件抛出的事件
const emits = defineEmits(['close', 'calculate-result'])

// 组件内部状态
const isModalOpen = ref(true)
const inputLat = ref('')
const inputLon = ref('')
const selectedDeviceName = ref<string | null>(null) // 使用名称作为选择状态
const result = ref('')

// 计算属性：根据名称获取完整装置对象
const selectedDevice = computed(() => {
  return selectedDeviceName.value
      ? props.devices.find(device => device.name === selectedDeviceName.value) || null
      : null
})

// 计算装置是否可达
const isDeviceReachable = computed(() => {
  return selectedDevice.value &&
      selectedDevice.value.sailing_speed !== null &&
      selectedDevice.value.sailing_speed > 0
})

// 装置选择变更时的处理
const onDeviceChange = (deviceName: string) => {
  selectedDeviceName.value = deviceName
  console.log('选中的装置名称:', deviceName)
  console.log('选中的装置对象:', selectedDevice.value)
}

// 组件初始化时设置默认值
onMounted(() => {
  if (props.devices.length > 0) {
    // 设置第一个装置为默认值
    selectedDeviceName.value = props.devices[0].name
  }
})

// 关闭弹窗
const closeModal = () => {
  isModalOpen.value = false
  emits('close')
}

// 距离计算（Haversine公式）
const calculateDistance = () => {
  // 验证输入
  const targetLat = parseFloat(inputLat.value)
  const targetLon = parseFloat(inputLon.value)

  if (isNaN(targetLat) || isNaN(targetLon)) {
    result.value = '请输入有效的经纬度！'
    return
  }

  if (targetLat < -90 || targetLat > 90 || targetLon < -180 || targetLon > 180) {
    result.value = '经纬度超出范围！'
    return
  }

  // 验证是否选择了装置
  if (!selectedDevice.value) {
    result.value = '请选择一个装置！'
    return
  }

  const baseLat = parseFloat(props.baseLat)
  const baseLon = parseFloat(props.baseLon)
  const device = selectedDevice.value

  if (isNaN(baseLat) || isNaN(baseLon)) {
    result.value = '基地经纬度数据异常！'
    return
  }

  // 计算距离
  const R = 6371 // 地球半径（公里）
  const dLat = (targetLat - baseLat) * (Math.PI / 180)
  const dLon = (targetLon - baseLon) * (Math.PI / 180)
  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(baseLat * (Math.PI / 180)) *
      Math.cos(targetLat * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // 计算时间
  let time = '不可达'
  const sailingSpeed = device.sailing_speed !== undefined
      ? device.sailing_speed
      : 0 // 确保有默认值

  if (sailingSpeed > 0) {
    // 速度单位假设为节(kn)，1节=1.852公里/小时
    const speedKmH = sailingSpeed * 1.852
    time = (distance / speedKmH).toFixed(2) + ' 小时'
  }

  // 生成结果
  result.value = `距离：${distance.toFixed(2)} 公里，大致耗时：${time}`

  // 发送计算结果到父组件
  emits('calculate-result', {
    deviceName: device.name,
    distance,
    time,
    reachable: sailingSpeed > 0
  })
}
</script>