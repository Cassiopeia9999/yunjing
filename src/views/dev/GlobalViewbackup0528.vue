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
  const mapContainerElement = mapContainer.value
  if (!mapContainerElement) {
    console.error('地图容器元素未找到')
    return
  }
  const myChart = echarts.init(mapContainerElement)
  myChart.showLoading()

  fetch('/assets/maps/china-province.json')
      .then(response => response.json())
      .then(chinaJson => {
        echarts.registerMap('china', chinaJson)

        fetchTableData(1, 10, BASE_FORM_ID, {})
            .then(response => {
              const data = response.data.list || []
              const locations = data.map(item => ({
                name: item.name,
                longitude: item.longitude,
                latitude: item.latitude,
                value: item.value || 0
              }));

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
                  formatter: '{b}: {c}'
                },
                geo: {
                  map: 'china',
                  roam: true,
                  label: {
                    show: true,
                    color: '#333',
                    fontSize: 10
                  },
                  itemStyle: {
                    areaColor: 'rgba(24, 144, 255, 0.5)',
                    borderColor: '#ccc',
                    borderWidth: 1,
                    shadowColor: '#ccc',
                    shadowBlur: 10
                  },
                  emphasis: {
                    itemStyle: {
                      areaColor: '#389BB7'
                    }
                  }
                },
                series: [
                  {
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    symbol: 'pin',
                    symbolSize: 40,
                    data: locations.map(item => ({
                      name: item.name,
                      value: [item.longitude, item.latitude, item.value]
                    })),
                    itemStyle: {
                      color: '#e74c3c'
                    },
                    label: {
                      show: true,
                      formatter: '{b}',
                      color: '#fff',
                      fontSize: 12
                    }
                  }
                ]
              };

              myChart.setOption(option)
              myChart.hideLoading()

              myChart.on('click', (params) => {
                if (params.seriesType === 'scatter') {
                  const baseName = params.name
                  const longitude = params.value[0]  // 获取经度
                  const latitude = params.value[1]   // 获取纬度

                  // 跳转到 'baseinfo' 页面，携带 baseName、longitude 和 latitude 参数
                  router.push({
                    name: 'baseinfo',
                    query: { baseName, longitude, latitude }
                  })
                }
              });

            })
            .catch(error => {
              console.error('动态数据加载失败:', error.message, error.stack);
              myChart.hideLoading()
            })
      })
      .catch(error => {
        console.error('地图数据加载失败:', error.message, error.stack);
        myChart.hideLoading()
      })

  window.addEventListener('resize', () => myChart.resize())
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
}
</style>