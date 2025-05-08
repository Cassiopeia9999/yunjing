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
        <PointSelector @point-selected="onPointSelected" />
      </div>
    </el-card>

    <!-- 特征图表展示 -->
    <el-card shadow="never">
      <div ref="chartRef" class="h-[400px]" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import PointSelector from "@/components/common/PointSelector.vue";
import axios from 'axios';

const showFilter = ref(true);
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
};

// 接收选中的测点 ID
function onPointSelected(pointId) {
  console.log('✅ 选中测点 ID:', pointId);
  // TODO: 加载特征数据并更新图表
}

const chartRef = ref(null);

// 模拟获取数据的函数
const fetchData = async () => {
  try {
    // 这里可以添加一个标志来判断是否使用真实数据库
    const useRealDatabase = false;
    if (useRealDatabase) {
      // 若使用真实数据库，发送请求到后端 API
      const response = await axios.get('/api/data');
      return response.data;
    } else {
      // 若不使用真实数据库，返回预设默认数据
      return [
        { date: 'Mon', highest: 10, lowest: 1 },
        { date: 'Tue', highest: 11, lowest: -2 },
        { date: 'Wed', highest: 13, lowest: 2 },
        { date: 'Thu', highest: 19, lowest: 5 },
        { date: 'Fri', highest: 12, lowest: 3 },
        { date: 'Sat', highest: 12, lowest: 2 },
        { date: 'Sun', highest: 9, lowest: 0 }
      ];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

onMounted(async () => {
  const chart = echarts.init(chartRef.value);

  const data = await fetchData();

  const xAxisData = data.map(item => item.date);
  const highestData = data.map(item => item.highest);
  const lowestData = data.map(item => item.lowest);

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
      data: xAxisData
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value} °C' }
    },
    series: [
      {
        name: 'Highest',
        type: 'line',
        data: highestData,
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
        data: lowestData,
        markPoint: {
          data: [{ name: '周最低', value: Math.min(...lowestData), xAxis: lowestData.indexOf(Math.min(...lowestData)), yAxis: Math.min(...lowestData) - 1.5 }]
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
  };

  chart.setOption(option);
});
</script>