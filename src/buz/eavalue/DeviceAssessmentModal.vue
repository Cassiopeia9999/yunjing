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

        <!-- 显示装置速度和健康寿命 -->
        <div v-if="selectedDevice" class="pt-2">
          <div>
            <span class="text-sm text-gray-500">航行速度:</span>
            <span
                class="ml-1 font-medium text-black"
                :class="{'text-red-500': !isDeviceReachableBySpeed}"
            >
            {{
                selectedDevice && selectedDevice.sailing_speed !== null
                    ? selectedDevice.sailing_speed + ' 节'
                    : '不可用'
              }}
          </span>
          </div>
          <div class="mt-1">
            <span class="text-sm text-gray-500">健康寿命 (天):</span>
            <span class="ml-1 font-medium text-black">
              {{ selectedDevice.nextMaintenance !== null ? selectedDevice.nextMaintenance : '未知' }}
            </span>
          </div>
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

      <!-- 可达装置列表 -->
      <div v-if="reachableDevices.length > 0" class="p-4 border-t">
        <h4 class="font-medium text-gray-700 mb-2">可达装置列表 (基于健康寿命评估)</h4>
        <ul class="list-disc pl-5 text-sm text-gray-800">
          <li v-for="device in reachableDevices" :key="device.name">
            {{ device.name }} (健康寿命: {{ device.nextMaintenance }} 天)
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, onMounted } from 'vue'
import { ElSelect, ElOption, ElInput, ElButton } from 'element-plus'

// 定义装置类型接口，以便更好地类型检查
interface Device {
  name: string;
  status: string;
  sailing_speed: number | null; // 节
  nextMaintenance: number | null; // 天
  // ...其他可能的属性
}

// 定义组件接收的属性
const props = defineProps({
  devices: {
    type: Array as () => Device[], // 明确类型
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
const reachableDevices = ref<Device[]>([]); // 新增：存储所有可达装置的列表

// 计算属性：根据名称获取完整装置对象
const selectedDevice = computed<Device | null>(() => {
  return selectedDeviceName.value
      ? props.devices.find(device => device.name === selectedDeviceName.value) || null
      : null
})

// 计算装置是否可达（基于速度）
const isDeviceReachableBySpeed = computed(() => {
  return selectedDevice.value &&
      selectedDevice.value.sailing_speed !== null &&
      selectedDevice.value.sailing_speed > 0
})

// 装置选择变更时的处理
const onDeviceChange = (deviceName: string) => {
  selectedDeviceName.value = deviceName
  console.log('选中的装置名称:', deviceName)
  console.log('选中的装置对象:', selectedDevice.value)
  result.value = ''; // 清空之前的评估结果
  reachableDevices.value = []; // 清空可达装置列表
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

/**
 * 判断装置是否可达的通用接口。
 * 根据耗时和装置健康寿命（以天为单位）判断。
 * 规则：耗时 x 2 小于等于 健康寿命 x 24 小时，则认为可达。
 * @param timeInHours 任务预估耗时 (小时)
 * @param deviceNextMaintenanceInDays 装置健康寿命 (天)
 * @returns boolean 是否可达
 */
const checkReachability = (timeInHours: number, deviceNextMaintenanceInDays: number | null): boolean => {
  if (deviceNextMaintenanceInDays === null || deviceNextMaintenanceInDays <= 0) {
    return false; // 如果健康寿命未知或为0，则认为不可达
  }
  // 将健康寿命从天转换为小时
  const maintenanceInHours = deviceNextMaintenanceInDays * 24;
  // 判断条件：耗时 x 2 <= 健康寿命（小时）
  return (timeInHours * 2) <= maintenanceInHours;
};


// 距离计算（Haversine公式）
const calculateDistance = () => {
  // 清空之前的评估结果和可达装置列表
  result.value = '';
  reachableDevices.value = [];

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
  const currentDevice = selectedDevice.value; // 使用更清晰的变量名

  if (isNaN(baseLat) || isNaN(baseLon)) {
    result.value = '基地经纬度数据异常！'
    return
  }

  // --- 计算距离 ---
  const R = 6371 // 地球半径（公里）
  const dLat = (targetLat - baseLat) * (Math.PI / 180)
  const dLon = (targetLon - baseLon) * (Math.PI / 180)
  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(baseLat * (Math.PI / 180)) *
      Math.cos(targetLat * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // 公里

  // --- 计算时间 ---
  let timeInHours: number | null = null;
  let timeDisplay = '不可达';
  let overallReachable = false; // 综合可达性

  const sailingSpeed = currentDevice.sailing_speed !== null
      ? currentDevice.sailing_speed
      : 0; // 确保有默认值

  if (sailingSpeed > 0) {
    // 速度单位假设为节(kn)，1节=1.852公里/小时
    const speedKmH = sailingSpeed * 1.852;
    timeInHours = distance / speedKmH;
    timeDisplay = timeInHours.toFixed(2) + ' 小时';

    // --- 新增：根据健康寿命判断可达性 ---
    const isReachableByHealth = checkReachability(timeInHours, currentDevice.nextMaintenance);
    overallReachable = isReachableByHealth; // 综合可达性取决于健康寿命判断

    result.value = `距离：${distance.toFixed(2)} 公里，大致耗时：${timeDisplay}。` +
        `根据健康寿命评估，当前装置${overallReachable ? '可达' : '不可达'}。`;

  } else {
    result.value = `距离：${distance.toFixed(2)} 公里，当前装置速度不可用，无法评估耗时及可达性。`;
  }

  // --- 遍历所有装置，找出可达的装置并显示 ---
  // 注意：这里是针对所有装置进行评估，而不是仅仅当前选择的装置
  props.devices.forEach(device => {
    if (device.sailing_speed !== null && device.sailing_speed > 0) {
      const speedKmH = device.sailing_speed * 1.852;
      const estimatedTimeInHours = distance / speedKmH;
      if (checkReachability(estimatedTimeInHours, device.nextMaintenance)) {
        reachableDevices.value.push(device);
      }
    }
  });


  // 发送计算结果到父组件
  emits('calculate-result', {
    deviceName: currentDevice.name,
    distance,
    time: timeInHours, // 发送数值型时间
    reachable: overallReachable // 发送综合可达性
  })
}
</script>

<style scoped>
/* 可以添加一些自定义样式 */
</style>
