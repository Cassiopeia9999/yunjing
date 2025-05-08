<template>
  <div class="map-container" ref="mapContainer"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { fetchTableData } from '@/api/querydata.js'
import { BASE_FORM_ID } from "@/api/form_constant.js";
import { useRouter } from 'vue-router';

const mapContainer = ref(null)
const router = useRouter();

onMounted(() => {
  const myChart = echarts.init(mapContainer.value)
  myChart.showLoading() // 显示加载状态

  // 加载地图数据（China 地图 JSON）
  fetch('/assets/maps/china-province.json')
      .then(response => response.json())
      .then(chinaJson => {
        echarts.registerMap('china', chinaJson) // 注册地图

        // 加载动态数据（假设后端返回正确格式）
        fetchTableData(1, 10, BASE_FORM_ID, {})
            .then(response => {
              const data = response.data.list || [] // 确保数据不为空
              const locations = data.map(item => ({
                name: item.name, // 地点名称（必须与地图上的名称一致，如 "北京市"）
                longitude: item.longitude, // 经度（必填）
                latitude: item.latitude, // 纬度（必填）
                value: item.value || 0 // 标记值（用于tooltip显示，可选）
              }))

              // 配置图表选项（关键：必须包含 geo 和 series）
              const option = {
                title: { text: '中国地图', left: 'center' },
                tooltip: { trigger: 'item', formatter: '{b}: {c}' },
                geo: {
                  map: 'china', // 使用注册的地图
                  roam: true,
                  label: { show: true, color: '#333' },
                  itemStyle: {
                    areaColor: 'rgba(24, 144, 255, 0.5)',
                    borderColor: '#ccc'
                  }
                },
                series: [
                  {
                    type: 'scatter', // 散点图标记
                    coordinateSystem: 'geo', // 基于地理坐标系
                    symbol: 'pin', // 标记图标（图钉）
                    symbolSize: 40, // 标记大小
                    data: locations.map(item => [ // 关键：ECharts 要求的格式是 [经度, 纬度, 值]
                      item.longitude,
                      item.latitude,
                      item.value // 第三个值用于tooltip或排序
                    ]),
                    // 标记样式（可选）
                    itemStyle: { color: '#e74c3c' },
                    label: { show: true, formatter: '{b}', color: '#fff' }
                  }
                ]
              }

              myChart.setOption(option) // ✅ 必须调用，否则图表不渲染
              myChart.hideLoading() // 隐藏加载状态

              // ✅ 正确绑定点击事件（必须在 setOption 之后，否则 params 可能为空）
              myChart.on('click', (params) => {
                // 确保点击的是 scatter 系列（避免点击地图区域触发）
                if (params.seriesType === 'scatter') {
                  const baseName = params.name // 获取标记的名称（来自 data.name）
                  // 跳转路由（使用命名路由，确保路径正确）
                  router.push({
                    name: 'baseinfo', // 路由配置中的 name: 'baseinfo'
                    query: { baseName }
                  });
                }
              })
            })
            .catch(error => {
              console.error('数据加载失败:', error)
              myChart.hideLoading()
            })
      })
      .catch(error => {
        console.error('地图数据加载失败:', error)
        myChart.hideLoading()
      })

  // 窗口Resize时自适应（可选）
  window.addEventListener('resize', () => myChart.resize())
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 800px; /* 建议设置明确高度，避免高度为0 */
}
</style>