<template>
  <div class="map-container" ref="mapContainer"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'  // 导入 ECharts 核心库
import  {fetchTableData}   from '@/api/querydata.js'
import {BASE_FORM_ID} from "@/api/form_constant.js";  // 导入后端请求方法

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

        // 从后端获取动态数据
        fetchTableData(1, 10, BASE_FORM_ID, {}).then((response) => {
          const data = response.data.list  // 假设 API 返回的数据结构包含 list 数组

          // 从后端数据构造 locations 数组
          const locations = data.map((item) => ({
            name: item.name,  // 假设后端返回的字段为 cityName
            longitude: item.longitude,  // 假设后端返回的字段为 longitude
            latitude: item.latitude,  // 假设后端返回的字段为 latitude
            value: 100,  // 假设后端返回的字段为 value
          }))

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
              console.error('Error fetching dynamic data:', error)
              myChart.hideLoading()  // 如果加载失败，也要隐藏加载状态
            })

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
