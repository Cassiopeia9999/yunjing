<template>
  <div class="flex gap-2">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue' // 引入 defineExpose
import { fetchTableData } from '@/api/query_data.js'
import {
  getSysConfigFormId
} from '@/api/constant/form_constant.js'

// 基础绑定
const selectedBaseId = ref(null)
const selectedUnitId = ref(null)
const selectedDeviceId = ref(null)

// 存储选中的完整对象 (用于联动逻辑，非必须暴露)
const selectedBase = ref(null)
const selectedUnit = ref(null)
const selectedDevice = ref(null)

// 存储下拉列表选项数据
const baseOptions = ref([])
const unitOptions = ref([])
const deviceOptions = ref([])
// const periodOptions = ref([]) // 周期相关的选项已移除
// const pointOptions = ref([]) // 测点相关的选项已移除

// 组件挂载时初始化加载基地数据
onMounted(() => {
  fetchTableData(1, 1000, getSysConfigFormId("BASE_FORM_ID"), {}).then(res => {
    baseOptions.value = res.data.list || []
  }).catch(error => {
    console.error('加载基地数据失败:', error)
  })
})

// 联动逻辑

// 基地选择变化时触发
function onBaseChange(baseId) {
  selectedBase.value = baseOptions.value.find(item => item.id === baseId)
  // 清空装置和设备选择
  selectedUnitId.value = null
  selectedUnit.value = null
  unitOptions.value = []

  selectedDeviceId.value = null
  selectedDevice.value = null
  deviceOptions.value = []

  // 根据选中的基地加载装置
  if (baseId) {
    fetchTableData(1, 1000, getSysConfigFormId("UNIT_FORM_ID"), [
      { key: 'parent_site', value: baseId, queryType: 1 }
    ]).then(res => {
      unitOptions.value = res.data.list || []
    }).catch(error => {
      console.error('加载装置数据失败:', error)
    })
  }
}

// 装置选择变化时触发
function onUnitChange(unitId) {
  selectedUnit.value = unitOptions.value.find(item => item.id === unitId)

  // 清空设备选择
  selectedDeviceId.value = null
  selectedDevice.value = null
  deviceOptions.value = []

  // 根据选中的基地和装置加载设备
  if (unitId && selectedBase.value) { // 确保基地也已选中
    fetchTableData(1, 1000, getSysConfigFormId("DEVICE_FORM_ID"), [
      { key: 'parent_system', value: unitId, queryType: 1 },
      { key: 'parent_site', value: selectedBase.value.id, queryType: 1 }
    ]).then(res => {
      deviceOptions.value = res.data.list || []
    }).catch(error => {
      console.error('加载设备数据失败:', error)
    })
  }
}

// 设备选择变化时触发 (此函数现在主要用于更新 selectedDevice)
function onDeviceChange(deviceId) {
  selectedDevice.value = deviceOptions.value.find(item => item.id === deviceId)
  // PeriodDataTable 将监听 selectedDeviceId 的变化来触发周期数据的获取
}

// 暴露选中的基地、装置、设备ID，供父组件使用进行过滤
defineExpose({
  selectedBaseId,
  selectedUnitId,
  selectedDeviceId
})

</script>

<style scoped>
.w-64 {
  width: 16rem;
}
.space-y-4 > *:not(style) ~ *:not(style) {
  margin-top: 1rem;
}
</style>
