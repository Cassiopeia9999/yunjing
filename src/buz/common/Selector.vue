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
import {onMounted, ref} from 'vue'
        import {fetchTableData} from '@/api/querydata.js'
        import {
          getSysConfigFormId
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
        const STORAGE_KEY_PREFIX = 'point-selector-cache-'
        function getCacheKey() {
          return `${STORAGE_KEY_PREFIX}${props.cacheKey}`
        }
      onMounted(async () => {
        const cache = JSON.parse(localStorage.getItem(getCacheKey()) || '{}')

        if (!cache.selectedBaseId) return

        // ① 设置基地并加载装置
        selectedBaseId.value = cache.selectedBaseId
        selectedBase.value = baseOptions.value.find(i => i.id === cache.selectedBaseId)

        const unitRes = await fetchTableData(1, 1000, getSysConfigFormId("UNIT_FORM_ID"), [
          {key: 'parent_site', value: cache.selectedBaseId, queryType: 1}
        ])
        unitOptions.value = unitRes.data.list || []

        if (!cache.selectedUnitId) return

        // ② 设置装置并加载设备
        selectedUnitId.value = cache.selectedUnitId
        selectedUnit.value = unitOptions.value.find(i => i.id === cache.selectedUnitId)

        const deviceRes = await fetchTableData(1, 1000, getSysConfigFormId("DEVICE_FORM_ID"), [
          {key: 'parent_system', value: cache.selectedUnitId, queryType: 1},
          {key: 'parent_site', value: cache.selectedBaseId, queryType: 1}
        ])
        deviceOptions.value = deviceRes.data.list || []

        if (!cache.selectedDeviceId) return

        // ③ 设置设备并加载特征数据
        selectedDeviceId.value = cache.selectedDeviceId
        selectedDevice.value = deviceOptions.value.find(i => i.id === cache.selectedDeviceId)

        const queryParams = [
          {key: 'device_id', value: selectedDevice.value.id, queryType: 1}
        ]
        const featureRes = await fetchTableData(1, 1000, getSysConfigFormId("FEATURE_DATA_FORM_ID"), queryParams)
        const featureDataList = featureRes.data.list || []

        // 设置特征类型
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

        // ④ 如果需要默认恢复一个特征
        if (cache.selectedFeatureName) {
          selectedFeatureName.value = cache.selectedFeatureName
          await loadFeatureData()
        }
      })


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

        function saveCache() {
          localStorage.setItem(getCacheKey(), JSON.stringify({
            selectedBaseId: selectedBaseId.value,
            selectedUnitId: selectedUnitId.value,
            selectedDeviceId: selectedDeviceId.value,
            selectedFeatureName: selectedFeatureName.value
          }))
        }

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
          saveCache()
          // 修复：正确使用UNIT_FORM_ID获取装置数据
          fetchTableData(1, 1000, getSysConfigFormId("UNIT_FORM_ID"), [
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
          saveCache()
          // 修复：正确传递装置ID和基地ID获取设备数据
          fetchTableData(1, 1000, getSysConfigFormId("DEVICE_FORM_ID"), [
            {key: 'parent_system', value: unitId, queryType: 1},
            {key: 'parent_site', value: selectedBase.value.id, queryType: 1}
          ]).then(res => {
            deviceOptions.value = res.data.list || [];
          });
        }

        function onDeviceChange(deviceId) {
          if (!deviceId) {
            selectedDevice.value = null
            featureTypeOptions.value = []
            return
          }
          saveCache()
          selectedDevice.value = deviceOptions.value.find(i => i.id === deviceId)

          // ✅ 查询设备对应的所有特征数据
          const queryParams = [
            { key: 'device_id', value: selectedDevice.value.id, queryType: 1 }
          ]

          fetchTableData(1, 1000, getSysConfigFormId("FEATURE_DATA_FORM_ID"), queryParams)
              .then(res => {
                const featureDataList = res.data.list || []

                // 生成唯一特征名列表作为下拉选项
                const uniqueFeatures = [...new Set(featureDataList.map(i => i.feature_name))].map(name => ({
                  feature_name: name
                }))
                featureTypeOptions.value = uniqueFeatures

                // 如果不展示选择器，直接将设备对象 + 特征数据发送出去
                if (!props.showFeatureSelector) {
                  emit('data-ready', {
                    device: selectedDevice.value,
                    features: featureDataList
                  })
                }
              })
              .catch(error => {
                console.error('加载设备特征数据失败:', error)
              })
        }


        // 加载特征数据
        async function loadFeatureData() {
          if (!selectedDeviceId.value || !selectedFeatureName.value) return;

          const queryParams = [
            {key: 'parent_device', value: selectedDevice.value.id, queryType: 1},
            {key: 'feature_alia_name', value: selectedFeatureName.value, queryType: 1}
          ];

          try {
            const res = await fetchTableData(1, 1000, getSysConfigFormId("FEATURE_DATA_FORM_ID"), queryParams);
            emit('data-ready', res.data.list || []);
          } catch (error) {
            console.error('加载特征数据失败:', error);
          }
        }
</script>