<template>
  <div class="p-6">
    <!-- 数据选择区域 -->
    <el-card shadow="never" class="mb-4">
      <div class="flex justify-between items-center">
        <span class="text-lg font-semibold">数据选择区域</span>
        <el-button @click="toggleFilter" type="primary" size="small">
          {{ showFilter ? '隐藏选择器' : '显示选择器' }}
        </el-button>
      </div>
      <div v-show="showFilter" class="mt-4">
        <!-- 替换为我们封装好的选择组件 -->
        <PointSelector @points-selected="handleSelectedPoints" />
      </div>
    </el-card>

    <!-- 特征图表展示 -->
    <el-card shadow="never">
      <div ref="chartRef" class="h-[400px]" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import PointSelector from "@/components/common/PointSelector.vue";

const showFilter = ref(true)
const toggleFilter = () => {
  showFilter.value = !showFilter.value
}

// 接收选中的测点 ID
function handleSelectedPoints(selectedPoints) {
  console.log("✅ 已选测点对象：", selectedPoints)
  // selectedPoints 是包含 id / point_name 等信息的数组
}


const chartRef = ref(null)

onMounted(() => {
  const chart = echarts.init(chartRef.value)

  const option = {
    title: {
      text: 'Temperature Change in the Coming Week'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {},
    toolbox: {
      show: true,
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        dataView: { readOnly: false },
        magicType: { type: ['line', 'bar'] },
        restore: {},
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value} °C' }
    },
    series: [
      {
        name: 'Highest',
        type: 'line',
        data: [10, 11, 13, 11, 12, 12, 9],
        markPoint: {
          data: [{ type: 'max', name: 'Max' }, { type: 'min', name: 'Min' }]
        },
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      },
      {
        name: 'Lowest',
        type: 'line',
        data: [1, -2, 2, 5, 3, 2, 0],
        markPoint: {
          data: [{ name: '周最低', value: -2, xAxis: 1, yAxis: -1.5 }]
        },
        markLine: {
          data: [
            { type: 'average', name: 'Avg' },
            [
              { symbol: 'none', x: '90%', yAxis: 'max' },
              {
                symbol: 'circle',
                label: { position: 'start', formatter: 'Max' },
                type: 'max',
                name: '最高点'
              }
            ]
          ]
        }
      }
    ]
  }

  chart.setOption(option)
})
</script>
