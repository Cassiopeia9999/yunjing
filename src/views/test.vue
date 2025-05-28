<template>
  <!-- 父容器，用于放置背景卫星图 -->
  <div class="map-background-container">
    <!-- ECharts 容器，背景透明 -->
    <div class="map-container" ref="mapContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { fetchTableData } from '@/api/querydata.js'
import { BASE_FORM_ID } from "@/api/form_constant.js";
import { useRouter } from 'vue-router';

// 如果需要进行坐标系转换，请安装并导入 coordtransform 库
// npm install coordtransform
// import coordtransform from 'coordtransform';

const mapContainer = ref(null)
const router = useRouter();

onMounted(() => {
  const mapContainerElement = mapContainer.value
  if (!mapContainerElement) {
    console.error('地图容器元素未找到')
    return
  }
  // 初始化 ECharts 实例，并设置背景透明
  const myChart = echarts.init(mapContainerElement, null, {
    backgroundColor: 'transparent' // 确保 ECharts 渲染的 canvas 背景是透明的
  })
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

              // --- 重要：坐标系转换提醒 ---
              // ECharts 的 geo 组件通常期望 WGS84 坐标系（GPS 坐标）。
              // 如果你的 `item.longitude` 和 `item.latitude` 是百度地图的 BD09 坐标
              // 或者国测局的 GCJ02 坐标，你必须在这里进行转换。
              // 否则，标记点将无法正确显示在地图上。

              // 示例：如果数据是 BD09，转换为 WGS84
              // const transformedLocations = locations.map(item => {
              //   const gcj02Point = coordtransform.bd09togcj02(item.longitude, item.latitude);
              //   const wgs84Point = coordtransform.gcj02towgs84(gcj02Point[0], gcj02Point[1]);
              //   return {
              //     ...item,
              //     longitude: wgs84Point[0], // 使用转换后的 WGS84 经度
              //     latitude: wgs84Point[1]   // 使用转换后的 WGS84 纬度
              //   };
              // });
              // 然后在 series.data 中使用 transformedLocations

              const option = {
                // ECharts 标题样式，适应卫星图背景
                title: {
                  left: 'center',
                  textStyle: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#fff' // 标题文字颜色改为白色，在深色卫星图背景上更清晰
                  }
                },
                tooltip: {
                  trigger: 'item',
                  formatter: '{b}: {c}'
                },
                geo: {
                  map: 'china',
                  // !!! 关键修改：禁用 ECharts 地图的平移和缩放功能 !!!
                  roam: false,

                  // !!! 关键修改：调整 geo 组件的位置和大小以对齐背景图 !!!
                  // 这些值需要根据你的 `map2.jpg` 卫星图的实际内容和比例进行微调。
                  // 你可能需要反复修改这些百分比，直到 ECharts 绘制的地图轮廓与背景图对齐。
                  left: '28.6%',
                  right: '28.6%',
                  top: '6%',
                  bottom: '14%',
                  zoom: 1.355,// 调整距离容器底部的距离 // 示例值，表示地图距离容器底部 5%
                  // 也可以使用 width 和 height 来设置地图的绝对或相对大小
                  // 例如：width: '90%', height: '90%',
                  // 或者设置中心点和缩放级别，如果你的背景图有明确的中心和范围
                  center: [104.5, 34.7],
                  // zoom: 1.0, // 示例：初始缩放级别

                  label: {
                    show: true,
                    color: '#fff', // 省份名称颜色改为白色，在卫星图上更清晰
                    fontSize: 10
                  },
                  itemStyle: {
                    // !!! 关键修改：省份区域颜色设置为透明或半透明，以便看到下面的卫星图 !!!
                    areaColor: 'rgba(24, 144, 255, 0.1)', // 非常浅的蓝色半透明，可以看到卫星图
                    borderColor: '#fff', // 省份边界颜色改为白色，与卫星图形成对比
                    borderWidth: 1,
                    shadowColor: 'rgba(0, 0, 0, 0.5)', // 阴影颜色，增加立体感
                    shadowBlur: 10
                  },
                  emphasis: {
                    itemStyle: {
                      areaColor: 'rgba(56, 155, 183, 0.5)', // 鼠标悬停时高亮颜色，半透明
                      borderColor: '#fff' // 鼠标悬停时边界颜色
                    }
                  }
                },
                series: [
                  {
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    symbol: 'pin',
                    symbolSize: 40,
                    // 如果进行了坐标转换，这里使用 transformedLocations
                    data: locations.map(item => ({
                      name: item.name,
                      value: [item.longitude, item.latitude, item.value]
                    })),
                    itemStyle: {
                      color: '#e74c3c' // 图钉颜色
                    },
                    label: {
                      show: true,
                      formatter: '{b}',
                      color: '#fff', // 图钉标签颜色改为白色
                      fontSize: 12,
                      position: 'top' // 标签位置在图钉上方
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
/* 父容器，用于放置背景卫星图 */
.map-background-container {
  width: 100%;
  height: 100vh; /* 确保容器占满视口高度 */
  background-image: url('/images/map2.jpg'); /* 你的卫星图路径 */
  background-size: cover; /* 确保背景图覆盖整个容器，可能裁剪 */
  /* 或者使用 contain，确保背景图完整显示，可能留白 */
  /* background-size: contain; */
  /* 或者固定尺寸，可能拉伸 */
  /* background-size: 100% 100%; */
  background-position: center; /* 背景图居中 */
  background-repeat: no-repeat; /* 不重复 */
  position: relative; /* 确保子元素可以相对于它定位 */
}

/* ECharts 容器 */
.map-container {
  width: 100%;
  height: 100%; /* 填充父容器 */
  background-color: transparent; /* ECharts 容器背景透明，显示下面的卫星图 */
  position: absolute; /* 绝对定位，覆盖在背景图上 */
  top: 0;
  left: 0;
}
</style>

