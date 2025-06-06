<template>
  <div class="p-2">
    <!-- 主容器：左侧固定宽度，右侧flex-1 -->
    <div class="flex flex-col lg:flex-row gap-3 p-1">
      <!-- 左侧数据选择区域 - 始终显示，固定宽度 -->
      <div class="lg:w-[300px]">
        <el-card shadow="hover" style="border-radius: 14px;">
          <div class="mb-6 text-center">
            <img
                src="/images/R-C.jpg"
                alt="数据选择图标"
                class="w-full max-w-lg mx-auto border rounded-lg border-gray-300 shadow-sm"
            >
          </div>

          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold">数据选择</span>
            <el-button @click="toggleFilter" type="primary" size="small">
              {{ showFilter ? '收起' : '展开' }}
            </el-button>
          </div>

          <div v-show="showFilter" class="mt-4 space-y-4">
            <PointSelector @data-ready="handleSelectedPoints" />
          </div>
        </el-card>
      </div>

      <!-- 右侧图表展示区域 - 始终占满剩余空间 -->
      <div class="min-w-0 flex-1 transition-all duration-300">
        <el-card shadow="hover" class="h-full flex flex-col" style="border-radius: 25px;">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold">特征趋势图</h3>
            <el-button
                @click="isConfigVisible = !isConfigVisible"
                icon="el-icon-settings"
                size="small"
                type="text"
            ></el-button>
          </div>
          <!-- 使用flex-1确保图表容器占  满剩余高度 -->
          <div
              ref="chartRef"
              class="min-h-[400px] w-full"
          />
          <div v-show="isConfigVisible" class="mt-4 flex items-center space-x-4">
            <el-switch
                v-model="showDateOnly"
                label="只显示日期"
                size="small"
            ></el-switch>
            <el-button size="small" @click="exportChart">导出图表</el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, watch, onUnmounted} from 'vue'
import * as echarts from 'echarts'
import PointSelector from '@/components/common/Selector.vue'
import {fetchTableData} from '@/api/querydata.js'
import {FEATURE_TYPE_FORM_ID, FEATURE_DATA_FORM_ID} from '@/api/form_constant.js'

// 控制左侧筛选区域的展开/收起
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
      text: '',
      left: 'center'
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
      type: 'scroll',
      orient: 'horizontal',
      bottom: '0%',
      data: []
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
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
        start: 70,
        end: 100
      },
      {
        type: 'inside',
        realtime: true,
        start: 70,
        end: 100
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
  fetchTableData(1, 1000, FEATURE_TYPE_FORM_ID, {})
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
  // const pointIds = selectedPoints.value.map((p) => p.id)
  // const queryParams = [
  //   {
  //     key: 'feature_type',
  //     value: selectedFeatureType.value,
  //     queryType: 1
  //   },
  //   {
  //     key: 'point_id',
  //     value: pointIds,
  //     queryType: null
  //   }
  // ]

  try {
    // const res = await fetchTableData(1, 1000, FEATURE_DATA_FORM_ID, queryParams)
    const data = selectedPoints.value

    if (data.length === 0) {
      chart.setOption({
        title: {
          text: '暂无数据',
          left: 'center'
        },
        series: []
      })
      return
    }

    // 提取所有时间戳并排序
    let timestamps = [...new Set(data.map((d) => d.cur_timestamp))].sort()
    // 根据配置处理时间格式
    timestamps = timestamps.map(ts => showDateOnly.value ? ts.split(' ')[0] : ts)

    // 每个测点一条线
    const series = selectedPoints.value.map((point) => {
      const pointData = data
          .filter((d) => d.parent_device.value === point.parent_device.value)
          .sort((a, b) => a.cur_timestamp.localeCompare(b.cur_timestamp))

      return {
        name: point.point_name,
        type: 'line',
        smooth: true,
        showSymbol: false,
        emphasis: {
          focus: 'series'
        },
        data: timestamps.map((ts) => {
          const found = pointData.find((d) => d.cur_timestamp === ts)
          return found ? found.feature_value : null
        })
      }
    })

    // 创建包含数据的完整配置
    const completeOption = JSON.parse(JSON.stringify(initialOption)) // 从初始配置复制
    completeOption.title.text = `${featureTypeOptions.value.find(t => t.id === selectedFeatureType.value)?.name || '特征'}趋势图`
    completeOption.legend.data = selectedPoints.value.map((point) => point.feature_alia_name)
    completeOption.xAxis.data = timestamps
    completeOption.series = series[0]

    // 使用 notMerge 参数确保完全替换现有配置
    chart.setOption(completeOption, true)
  } catch (error) {
    console.error('加载特征数据失败:', error)
  }
}

// 监听 showDateOnly 变化，重新加载数据
watch(showDateOnly, () => {
  loadFeatureData()
})

// 导出图表
function exportChart() {
  chart.downloadImage({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })
}

// 组件销毁时销毁图表实例
onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>
/* 移除自定义CSS，使用Tailwind类替代 */
</style>
