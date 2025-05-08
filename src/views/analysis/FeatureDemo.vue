<template>
  <div class="p-6">
    <el-card shadow="never" class="mb-4">
      <div class="flex justify-between items-center">
        <span class="text-lg font-semibold">数据选择区域</span>
        <el-button @click="toggleFilter" type="primary" size="small">
          {{ showFilter ? '隐藏选择器' : '显示选择器' }}
        </el-button>
      </div>

      <div v-show="showFilter" class="mt-4 space-y-4">
        <!-- 测点多选 -->
        <PointSelector @points-selected="handleSelectedPoints" />

        <!-- 特征类型单选 -->
        <el-select
            v-if="featureTypeOptions.length > 0"
            v-model="selectedFeatureType"
            filterable
            clearable
            placeholder="请选择特征类型"
            class="w-64"
            @change="loadFeatureData"
        >
          <el-option
              v-for="item in featureTypeOptions"
              :key="item.id"
              :label="item.feature_alias || item.name"
              :value="item.id"
          />
        </el-select>
      </div>
    </el-card>

    <!-- 图表展示 -->
    <el-card shadow="never">
      <div ref="chartRef" class="h-[400px]" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import PointSelector from '@/components/common/PointSelector.vue'
import { fetchTableData } from '@/api/querydata.js'
import { FEATURE_TYPE_FORM_ID, FEATURE_DATA_FORM_ID } from '@/api/form_constant.js'

// 控制折叠
const showFilter = ref(true)
const toggleFilter = () => (showFilter.value = !showFilter.value)

// 当前选中的测点与特征类型
const selectedPoints = ref([])
const selectedFeatureType = ref(null)
const featureTypeOptions = ref([])

// 图表引用
const chartRef = ref(null)
let chart = null

// 初始化图表
onMounted(() => {
  chart = echarts.init(chartRef.value)
})

// 加载特征类型下拉选项
fetchTableData(1, 1000, FEATURE_TYPE_FORM_ID).then((res) => {
  featureTypeOptions.value = res.data.list || []
  if (featureTypeOptions.value.length > 0) {
    selectedFeatureType.value = featureTypeOptions.value[0].id
  }
})

// 当测点发生变化时触发
function handleSelectedPoints(points) {
  selectedPoints.value = points
  loadFeatureData()
}

// 加载特征数据并渲染图表
async function loadFeatureData() {
  if (selectedPoints.value.length === 0 || !selectedFeatureType.value) return

  const pointIds = selectedPoints.value.map((p) => p.id)

  const queryParams = [
    {
      key: 'feature_type',
      value: selectedFeatureType.value,
      queryType: 1
    },
    {
      key: 'point_id',
      value: pointIds,
      queryType: null
    }
  ]

  const res = await fetchTableData(1, 1000, FEATURE_DATA_FORM_ID, queryParams)
  const data = res.data.list || []

  // 提取所有时间戳并排序
  const timestamps = [...new Set(data.map((d) => d.cur_timestamp))].sort()

  // 每个测点一条线
  const series = selectedPoints.value.map((point) => {
    const pointData = data
        .filter((d) => d.point_id.value === point.id)
        .sort((a, b) => a.cur_timestamp.localeCompare(b.cur_timestamp))

    return {
      name: point.point_name,
      type: 'line',
      data: timestamps.map((ts) => {
        const found = pointData.find((d) => d.cur_timestamp === ts)
        return found ? found.feature_value : null
      })
    }
  })

  // 更新图表
  chart.setOption({
    title: {
      text: '特征趋势图'
    },
    tooltip: { trigger: 'axis' },
    legend: {},
    xAxis: {
      type: 'category',
      data: timestamps
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}' }
    },
    series
  })
}
</script>
