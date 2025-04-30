<template>
  <div class="map-container" ref="mapContainer"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'  // 导入 ECharts 核心库

// 地图容器的引用
const mapContainer = ref(null)

onMounted(() => {
  // 初始化 ECharts 实例
  const myChart = echarts.init(mapContainer.value)

  // 显示加载状态
  myChart.showLoading()

  // 使用 fetch 加载本地 china.json 地图数据
  fetch('/assets/maps/china.json')  // 从 public 目录加载文件
      .then((response) => response.json())
      .then((chinaJson) => {
        // 注册中国地图数据
        echarts.registerMap('china', chinaJson)

        // 模拟5个带有经纬度的数据
        const locations = [
          { name: '北京', longitude: 116.4074, latitude: 39.9042, value: 100 },
          { name: '上海', longitude: 121.4737, latitude: 31.2304, value: 200 },
          { name: '广州', longitude: 113.2644, latitude: 23.1291, value: 150 },
          { name: '深圳', longitude: 114.0579, latitude: 22.5431, value: 180 },
          { name: '成都', longitude: 104.0668, latitude: 30.5728, value: 130 },
        ]

        // 配置 ECharts 的地图选项
        const option = {
          title: {
            text: '中国地图',
            left: 'center',
            textStyle: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#333'
            }
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}'  // 显示地点名和数值
          },
          geo: {
            map: 'china',  // 使用中国地图
            roam: true,    // 允许缩放和拖动
            label: {
              show: true,
              color: '#333',  // 设置标签颜色
              fontSize: 10
            },
            itemStyle: {
              areaColor: 'rgba(24, 144, 255, 0.5)',  // 使用渐变色
              borderColor: '#ccc',  // 边框颜色
              borderWidth: 1,
              shadowColor: '#ccc',  // 添加阴影效果
              shadowBlur: 10
            },
            emphasis: {
              itemStyle: {
                areaColor: '#389BB7'  // 鼠标悬停时改变区域颜色
              }
            },
          },
          series: [
            {
              type: 'scatter',
              coordinateSystem: 'geo',
              data: locations.map((item) => ({
                name: item.name,
                value: [item.longitude, item.latitude, item.value], // 经纬度和数值
              })),
              symbol: 'image://icons/marker-icon.svg', // 使用图标文件作为标记
              symbolSize: 30, // 图标大小
              label: {
                show: true,
                color: '#fff',
                fontSize: 12,
              },
              itemStyle: {
                color: 'transparent',  // 图标颜色透明，因为我们已经设置了自定义图标
              },
            }
          ]
        }

        // 隐藏加载状态
        myChart.hideLoading()

        // 设置图表的选项
        myChart.setOption(option)
      })
      .catch((error) => {
        console.error('Error loading China map data:', error)
        myChart.hideLoading()  // 如果加载失败，也要隐藏加载状态
      })

  // 可选：窗口大小改变时，自动调整图表大小
  window.addEventListener('resize', () => {
    myChart.resize()
  })
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 1500px;  /* 设置地图容器的高度 */
}
</style>
