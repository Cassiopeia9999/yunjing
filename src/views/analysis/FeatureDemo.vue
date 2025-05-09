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
      <div class="flex justify-end mb-4">
        <el-button
            @click="isConfigVisible = !isConfigVisible"
            icon="el-icon-settings"
            size="small"
            type="text"
        ></el-button>
      </div>
      <div ref="chartRef" class="h-[400px]" />
      <div v-show="isConfigVisible" class="mt-4">
        <el-switch
            v-model="showDateOnly"
            label="只显示年月日"
            size="small"
        ></el-switch>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import {ref, onMounted, watch, onUnmounted} from 'vue'
import * as echarts from 'echarts'
import PointSelector from '@/components/common/PointSelector.vue'
import {fetchTableData} from '@/api/querydata.js'
import {FEATURE_TYPE_FORM_ID, FEATURE_DATA_FORM_ID} from '@/api/form_constant.js'

// 控制折叠
const showFilter = ref(true)
const toggleFilter = () => (showFilter.value = !showFilter.value)

// 当前选中的测点与特征类型
const selectedPoints = ref([])
const selectedFeatureType = ref(null)
const featureTypeOptions = ref([])

// 图表引用和初始配置
const chartRef = ref(null)
let chart = null
let initialOption = null // 保存初始配置

// 新增配置状态
const showDateOnly = ref(false)
const isConfigVisible = ref(false)

// 初始化图表
onMounted(() => {
  chart = echarts.init(chartRef.value)

  // 设置基础图表配置（不含数据）
  const baseOption = {
    title: {
      text: '特征趋势图'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        animation: false,
        label: {
          backgroundColor: '#505765'
        }
      }
    },
    legend: {
      data: []
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value',
      axisLabel: {formatter: '{value}'}
    },
    series: [],
    dataZoom: [
      {
        show: true,
        realtime: true,
        start: 65,
        end: 85
      },
      {
        type: 'inside',
        realtime: true,
        start: 65,
        end: 85
      }
    ],
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        restore: {},
        saveAsImage: {}
      }
    }
  }

  // 设置基础配置并保存为初始配置
  chart.setOption(baseOption)
  initialOption = JSON.parse(JSON.stringify(baseOption)) // 深拷贝初始配置

  // 加载特征类型下拉选项
  fetchTableData(1, 1000, FEATURE_TYPE_FORM_ID)
      .then((res) => {
        featureTypeOptions.value = res.data.list || []
        if (featureTypeOptions.value.length > 0) {
          selectedFeatureType.value = featureTypeOptions.value[0].id
        }
      })
      .catch((error) => {
        console.error('加载特征类型选项失败:', error)
      })
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

  try {
    const res = await fetchTableData(1, 1000, FEATURE_DATA_FORM_ID, queryParams)
    const data = res.data.list || []

    // 提取所有时间戳并排序
    let timestamps = [...new Set(data.map((d) => d.cur_timestamp))].sort()
    // 根据配置处理时间格式
    timestamps = timestamps.map(ts => showDateOnly.value ? ts.split(' ')[0] : ts)

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

    // 创建包含数据的完整配置
    const completeOption = JSON.parse(JSON.stringify(initialOption)) // 从初始配置复制
    completeOption.legend.data = selectedPoints.value.map((point) => point.point_name)
    completeOption.xAxis.data = timestamps
    completeOption.series = series

    // 使用 notMerge 参数确保完全替换现有配置
    chart.setOption(completeOption, true)
  } catch (error) {
    console.error('加载特征数据失败:', error)
  }
}

// 监听 showDateOnly 变化，重新加载数据（也可优化为直接更新 X 轴）
watch(showDateOnly, () => {
  loadFeatureData()
})

// 组件销毁时销毁图表实例
onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>

</style>