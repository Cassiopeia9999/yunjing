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

    <!-- 特征类型选择 -->
    <el-select
        v-model="selectedFeatureName"
        filterable
        clearable
        :placeholder="selectedDeviceId ? '请选择数据类型' : '请先选择设备'"
        class="w-full"
        @change="loadFeatureData"
    >
      <template v-if="featureTypeOptions.length > 0">
        <el-option
            v-for="item in featureTypeOptions"
            :key="item.feature_name"
            :label="item.feature_name"
            :value="item.feature_name"
        />
      </template>
      <template v-else>
        <el-option disabled label="无数据" value="" />
      </template>
    </el-select>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {fetchTableData} from '@/api/querydata.js'
import {
  BASE_FORM_ID,
  UNIT_FORM_ID, // 修复：正确使用UNIT_FORM_ID
  DEVICE_FORM_ID,
  FEATURE_DATA_FORM_ID,
  Equipment_Characteristic_Data
} from '@/api/form_constant.js'

const emit = defineEmits(['data-ready']);

// 基础绑定
const selectedBaseId = ref(null);
const selectedUnitId = ref(null);
const selectedDeviceId = ref(null);
const selectedBase = ref(null);
const selectedUnit = ref(null);
const selectedDevice = ref(null);
const baseOptions = ref([]);
const unitOptions = ref([]);
const deviceOptions = ref([]);
const featureTypeOptions = ref([]);
const selectedFeatureName = ref(null);

// 初始化基地数据
fetchTableData(1, 1000, BASE_FORM_ID, {}).then(res => {
  baseOptions.value = res.data.list || [];
});

// 基地选择联动
function onBaseChange(baseId) {
  selectedBase.value = baseOptions.value.find(i => i.id === baseId);
  selectedUnitId.value = null;
  selectedUnit.value = null;
  unitOptions.value = [];
  selectedDeviceId.value = null;
  selectedDevice.value = null;
  deviceOptions.value = [];
  featureTypeOptions.value = [];

  // 修复：正确使用UNIT_FORM_ID获取装置数据
  fetchTableData(1, 1000, UNIT_FORM_ID, [
    {key: 'parent_site', value: baseId, queryType: 1}
  ]).then(res => {
    unitOptions.value = res.data.list || [];
  });
}

// 装置选择联动
function onUnitChange(unitId) {
  selectedUnit.value = unitOptions.value.find(i => i.id === unitId);
  selectedDeviceId.value = null;
  selectedDevice.value = null;
  deviceOptions.value = [];
  featureTypeOptions.value = [];

  // 修复：正确传递装置ID和基地ID获取设备数据
  fetchTableData(1, 1000, DEVICE_FORM_ID, [
    {key: 'parent_system', value: unitId, queryType: 1},
    {key: 'parent_site', value: selectedBase.value.id, queryType: 1}
  ]).then(res => {
    deviceOptions.value = res.data.list || [];
  });
}

// 设备选择联动
function onDeviceChange(deviceId) {
  if (deviceId) {
    selectedDevice.value = deviceOptions.value.find(i => i.id === deviceId);
    fetchTableData(1, 1000, Equipment_Characteristic_Data, {})
        .then(res => {
          const allFeatures = res.data.list || [];
          const matchedFeatures = allFeatures.filter(
              item => item.device_id.name === selectedDevice.value.device_name
          );
          const uniqueFeatures = [...new Set(matchedFeatures.map(i => i.feature_name))].map(name => ({
            feature_name: name
          }));
          featureTypeOptions.value = uniqueFeatures;
        })
        .catch(error => {
          console.error('加载设备特征失败:', error);
        });
  } else {
    featureTypeOptions.value = [];
  }
}

// 加载特征数据
async function loadFeatureData() {
  if (!selectedDeviceId.value || !selectedFeatureName.value) return;

  const queryParams = [
    {key: 'parent_device', value: selectedDevice.value.id, queryType: 1},
    {key: 'feature_alia_name', value: selectedFeatureName.value, queryType: 1}
  ];

  try {
    const res = await fetchTableData(1, 1000, FEATURE_DATA_FORM_ID, queryParams);
    emit('data-ready', res.data.list || []);
  } catch (error) {
    console.error('加载特征数据失败:', error);
  }
}
</script>