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
        v-if="props.showFeatureSelector"
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
import { onMounted, ref } from 'vue'
import { fetchTableData } from '@/api/querydata.js'
import {
  BASE_FORM_ID, DEVICE_FORM_ID, FEATURE_DATA_FORM_ID,
  getSysConfigFormId, UNIT_FORM_ID
} from '@/api/constant/form_constant.js'

const emit = defineEmits(['data-ready']);
const props = defineProps({
  showFeatureSelector: {
    type: Boolean,
    default: false
  },
  cacheKey: {
    type: String,
    required: true
  }
})

// 缓存相关配置
const STORAGE_KEY_PREFIX = 'point-selector-cache-'
function getCacheKey() {
  return `${STORAGE_KEY_PREFIX}${props.cacheKey}`
}

// 响应式变量定义
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
onMounted(async () => {
  // 加载基地列表
  fetchTableData(1, 1000, getSysConfigFormId("BASE_FORM_ID"), []).then(res => {
    baseOptions.value = res.data.list || [];
  });

  // 尝试从缓存恢复状态
  const cache = JSON.parse(localStorage.getItem(getCacheKey()) || '{}')
  if (!cache.selectedBaseId) return

  // ① 恢复基地并加载装置
  selectedBaseId.value = cache.selectedBaseId
  selectedBase.value = baseOptions.value.find(i => i.id === cache.selectedBaseId)

  const unitRes = await fetchTableData(1, 1000, getSysConfigFormId("UNIT_FORM_ID"), [
    { key: 'parent_site', value: cache.selectedBaseId, queryType:  "="  } // 使用数字类型的queryType
  ])
  unitOptions.value = unitRes.data.list || []

  if (!cache.selectedUnitId) return

  // ② 恢复装置并加载设备
  selectedUnitId.value = cache.selectedUnitId
  selectedUnit.value = unitOptions.value.find(i => i.id === cache.selectedUnitId)

  const deviceRes = await fetchTableData(1, 1000, getSysConfigFormId("DEVICE_FORM_ID"), [
    { key: 'parent_system', value: cache.selectedUnitId, queryType:  "="  },
    { key: 'parent_site', value: cache.selectedBaseId, queryType:  "="  }
  ])
  deviceOptions.value = deviceRes.data.list || []

  if (!cache.selectedDeviceId) return

  // ③ 恢复设备并加载特征数据
  selectedDeviceId.value = cache.selectedDeviceId
  selectedDevice.value = deviceOptions.value.find(i => i.id === cache.selectedDeviceId)

  const queryParams = [
    { key: 'device_id', value: selectedDevice.value.id, queryType:  "="  }
  ]
  const featureRes = await fetchTableData(1, 1000, getSysConfigFormId("FEATURE_DATA_FORM_ID"), queryParams)
  const featureDataList = featureRes.data.list || []

  // 设置特征类型选项
  const uniqueFeatures = [...new Set(featureDataList.map(i => i.feature_name))].map(name => ({
    feature_name: name
  }))
  featureTypeOptions.value = uniqueFeatures

  if (!props.showFeatureSelector) {
    emit('data-ready', {
      device: selectedDevice.value,
      features: featureDataList
    })
  }

  // ④ 恢复特征选择
  if (cache.selectedFeatureName) {
    selectedFeatureName.value = cache.selectedFeatureName
    await loadFeatureData()
  }
})

// 保存当前选择状态到缓存
function saveCache() {
  localStorage.setItem(getCacheKey(), JSON.stringify({
    selectedBaseId: selectedBaseId.value,
    selectedUnitId: selectedUnitId.value,
    selectedDeviceId: selectedDeviceId.value,
    selectedFeatureName: selectedFeatureName.value
  }))
}

// 基地选择变化时加载装置列表
function onBaseChange(baseId) {
  selectedBase.value = baseOptions.value.find(i => i.id === baseId);
  selectedUnitId.value = null;
  selectedUnit.value = null;
  unitOptions.value = [];
  selectedDeviceId.value = null;
  selectedDevice.value = null;
  deviceOptions.value = [];
  featureTypeOptions.value = [];
  saveCache()

  // 查询装置列表，使用数字类型的queryType
  fetchTableData(1, 1000, getSysConfigFormId("UNIT_FORM_ID"), [
    { key: 'parent_site', value: baseId, queryType:  "="  } // 1 对应 "="
  ]).then(res => {
    unitOptions.value = res.data.list || [];
  });
}

// 装置选择变化时加载设备列表
function onUnitChange(unitId) {
  selectedUnit.value = unitOptions.value.find(i => i.id === unitId);
  selectedDeviceId.value = null;
  selectedDevice.value = null;
  deviceOptions.value = [];
  featureTypeOptions.value = [];
  saveCache()

  // 查询设备列表
  fetchTableData(1, 1000, getSysConfigFormId("DEVICE_FORM_ID"), [
    { key: 'parent_system', value: unitId, queryType:  "="  }, // 等于
    { key: 'parent_site', value: selectedBase.value.id, queryType:  "="  } // 等于
  ]).then(res => {
    deviceOptions.value = res.data.list || [];
  });
}

// 设备选择变化时加载特征数据
function onDeviceChange(deviceId) {
  if (!deviceId) {
    selectedDevice.value = null
    featureTypeOptions.value = []
    return
  }
  saveCache()
  selectedDevice.value = deviceOptions.value.find(i => i.id === deviceId)

  // 查询设备对应的所有特征数据
  const queryParams = [
    { key: 'device_id', value: selectedDevice.value.id, queryType:  "="  } // 等于查询
  ]

  fetchTableData(1, 1000, getSysConfigFormId("FEATURE_DATA_FORM_ID"), queryParams)
      .then(res => {
        const featureDataList = res.data.list || []

        // 生成唯一特征名列表
        const uniqueFeatures = [...new Set(featureDataList.map(i => i.feature_name))].map(name => ({
          feature_name: name
        }))
        featureTypeOptions.value = uniqueFeatures

        // 如果不展示特征选择器，直接发送数据
        if (!props.showFeatureSelector) {
          emit('data-ready', {
            device: selectedDevice.value,
            features: featureDataList,
            featureName: null
          })
        }
      })
      .catch(error => {
        console.error('加载设备特征数据失败:', error)
      })
}

// 加载特定特征数据
async function loadFeatureData() {
  if (!selectedDeviceId.value || !selectedFeatureName.value) return;

  const queryParams = [
    { key: 'parent_device', value: selectedDevice.value.id, queryType: "=" }, // 等于
    { key: 'feature_alia_name', value: selectedFeatureName.value, queryType: "like" } // 使用like查询（9对应like）
  ];

  try {
    const res = await fetchTableData(1, 1000, getSysConfigFormId("FEATURE_DATA_FORM_ID"), queryParams);
    emit('data-ready', {
         device: selectedDevice.value,
         features: res.data.list || [],
         featureName: selectedFeatureName.value
    });
  } catch (error) {
    console.error('加载特征数据失败:', error);
  }
}
</script>
