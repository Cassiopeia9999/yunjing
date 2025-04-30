<template>
  <div>Test</div>
  <el-card>
    <p>在这里展示具体的业务内容</p>
  </el-card>
<!--  <div class="map-container" ref="mapContainer"></div>-->
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'  // 导入 ECharts 核心库

// 地图容器的引用
const mapContainer = ref(null)

onMounted(() => {
  // 初始化 ECharts 实例
  const myChart = echarts.init(mapContainer.value)

  // 注册中国地图数据（你可以通过本地路径加载 GeoJSON 数据）
  // 如果要使用 ECharts 自带的地图数据，可以直接注册
  echarts.registerMap('china', echarts.getMap('china').geoJson)

  // 配置 ECharts 的地图选项
  const option = {
    title: {
      text: '中国地图',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}'  // 显示地区名称
    },
    geo: {
      map: 'china',  // 使用中国地图
      roam: true,    // 允许缩放和拖动
      label: {
        show: true
      },
      itemStyle: {
        areaColor: '#f3f3f3',  // 地区颜色
        borderColor: '#ccc',   // 边框颜色
        borderWidth: 1         // 边框宽度
      },
    }
  }

  // 使用配置项设置图表
  myChart.setOption(option)

  // 可选：窗口大小改变时，自动调整图表大小
  window.addEventListener('resize', () => {
    myChart.resize()
  })
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 500px;  /* 设置地图容器的高度 */
}
</style>
