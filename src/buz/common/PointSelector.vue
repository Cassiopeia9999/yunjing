<template>
  <div class="space-y-4">
    <!-- 基地 -->
    <el-select v-model="selectedBaseId" placeholder="选择基地" @change="onBaseChange" class="w-64">
      <el-option v-for="item in baseOptions" :key="item.id" :label="item.name" :value="item.id" />
    </el-select>

    <!-- 装置 -->
    <el-select v-model="selectedUnitId" placeholder="选择装置" @change="onUnitChange" class="w-64">
      <el-option v-for="item in unitOptions" :key="item.id" :label="item.system_name" :value="item.id" />
    </el-select>

    <!-- 设备 -->
    <el-select v-model="selectedDeviceId" placeholder="选择设备" @change="onDeviceChange" class="w-64">
      <el-option v-for="item in deviceOptions" :key="item.id" :label="item.device_name" :value="item.id" />
    </el-select>

    <el-select
        v-if="pointOptions.length > 0"
        v-model="selectedPointIds"
        multiple
        filterable
        clearable
        placeholder="请选择测点"
        @change="onPointMultiChange"
        class="w-full"
    >
      <el-option
          v-for="item in pointOptions"
          :key="item.id"
          :label="item.point_name"
          :value="item.id"
      />
    </el-select>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { fetchTableData } from '@/api/querydata.js'
import {
  BASE_FORM_ID,
  UNIT_FORM_ID,
  DEVICE_FORM_ID,
  POINT_FORM_ID
} from '@/api/constant/form_constant.js'

const emit = defineEmits(['points-selected'])  // 多测点返回

// 基础绑定
const selectedBaseId = ref(null)
const selectedUnitId = ref(null)
const selectedDeviceId = ref(null)
const selectedPointIds = ref([]) // 多测点 ID 数组

const selectedBase = ref(null)
const selectedUnit = ref(null)
const selectedDevice = ref(null)

const baseOptions = ref([])
const unitOptions = ref([])
const deviceOptions = ref([])
const pointOptions = ref([])

// 初始化加载基地
fetchTableData(1, 1000, BASE_FORM_ID, {}).then(res => {
  baseOptions.value = res.data.list || []
})

// 联动逻辑
function onBaseChange(baseId) {
  selectedBase.value = baseOptions.value.find(item => item.id === baseId)
  selectedUnitId.value = null
  selectedUnit.value = null
  unitOptions.value = []

  selectedDeviceId.value = null
  selectedDevice.value = null
  deviceOptions.value = []

  selectedPointIds.value = []
  pointOptions.value = []

  fetchTableData(1, 1000, UNIT_FORM_ID, [
    { key: 'parent_site', value: baseId, queryType: 1 }
  ]).then(res => {
    unitOptions.value = res.data.list || []
  })
}

function onUnitChange(unitId) {
  selectedUnit.value = unitOptions.value.find(item => item.id === unitId)

  selectedDeviceId.value = null
  selectedDevice.value = null
  deviceOptions.value = []

  selectedPointIds.value = []
  pointOptions.value = []

  fetchTableData(1, 1000, DEVICE_FORM_ID, [
    { key: 'parent_system', value: unitId, queryType: 1 },
    { key: 'parent_site', value: selectedBase.value.id, queryType: 1 }
  ]).then(res => {
    deviceOptions.value = res.data.list || []
  })
}

function onDeviceChange(deviceId) {
  selectedDevice.value = deviceOptions.value.find(item => item.id === deviceId)
  selectedPointIds.value = []
  pointOptions.value = []

  fetchTableData(1, 1000, POINT_FORM_ID, [
    { key: 'equipment_id', value: deviceId, queryType: 1 }
  ]).then(res => {
    pointOptions.value = res.data.list || []
  })
}

// 多测点选择结果通知
function onPointMultiChange(newIds) {
  // 过滤出被选中的测点对象
  const selectedPoints = pointOptions.value.filter(item => newIds.includes(item.id))
  emit('points-selected', selectedPoints)
  console.log("✅ 发出完整测点对象数组：", selectedPoints)
}


</script>
