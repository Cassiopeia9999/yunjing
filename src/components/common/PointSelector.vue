<template>
  <div class="space-y-4">
    <el-select v-model="selectedBase" placeholder="选择基地" @change="onBaseChange" class="w-64">
      <el-option v-for="item in baseOptions" :key="item.id" :label="item.name" :value="item" />
    </el-select>

    <el-select v-model="selectedUnit" placeholder="选择装置" @change="onUnitChange" class="w-64">
      <el-option v-for="item in unitOptions" :key="item.id" :label="item.system_name" :value="item" />
    </el-select>

    <el-select v-model="selectedDevice" placeholder="选择设备" @change="onDeviceChange" class="w-64">
      <el-option v-for="item in deviceOptions" :key="item.id" :label="item.component_name" :value="item" />
    </el-select>

    <el-select v-model="selectedPoint" placeholder="选择测点" @change="onPointChange" class="w-64">
      <el-option v-for="item in pointOptions" :key="item.id" :label="item.point_name" :value="item" />
    </el-select>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import {fetchTableData} from "@/api/querydata.js";
import {BASE_FORM_ID, DEVICE_FORM_ID, POINT_FORM_ID, UNIT_FORM_ID} from "@/api/form_constant.js";

const emit = defineEmits(['point-selected'])

// 当前选中项
const selectedBase = ref(null)
const selectedUnit = ref(null)
const selectedDevice = ref(null)
const selectedPoint = ref(null)

// 下拉选项
const baseOptions = ref([])
const unitOptions = ref([])
const deviceOptions = ref([])
const pointOptions = ref([])

// 加载基地列表
fetchTableData(1, 1000, BASE_FORM_ID, {}).then(res => {
  baseOptions.value = res.data.list || []
})

function onBaseChange(base) {
  selectedUnit.value = null
  selectedDevice.value = null
  selectedPoint.value = null
  unitOptions.value = []
  deviceOptions.value = []
  pointOptions.value = []

  fetchTableData(1, 1000, UNIT_FORM_ID, {
    queryParamVOs: JSON.stringify([
      { key: 'parent_site', value: base.name, queryType: 1 }
    ])
  }).then(res => {
    unitOptions.value = res.data.list || []
  })
}

function onUnitChange(unit) {
  selectedDevice.value = null
  selectedPoint.value = null
  deviceOptions.value = []
  pointOptions.value = []

  fetchTableData(1, 1000, DEVICE_FORM_ID, {
    queryParamVOs: JSON.stringify([
      { key: 'parent_system', value: unit.system_name, queryType: 1 },
      { key: 'parent_site', value: selectedBase.value.name, queryType: 1 }
    ])
  }).then(res => {
    deviceOptions.value = res.data.list || []
  })
}

function onDeviceChange(device) {
  selectedPoint.value = null
  pointOptions.value = []

  fetchTableData(1, 1000, POINT_FORM_ID, {
    queryParamVOs: JSON.stringify([
      { key: 'equipment_id', value: device.component_name, queryType: 1 }
    ])
  }).then(res => {
    pointOptions.value = res.data.list || []
  })
}

function onPointChange(point) {
  emit('point-selected', point.id)
}
</script>
