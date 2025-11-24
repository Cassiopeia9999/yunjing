<template>
  <!-- 父容器，用于放置背景卫星图，并应用transform进行缩放平移 -->
  <!-- overflow: hidden; 确保缩放时内容超出容器不显示滚动条 -->
  <div
      class="map-background-container"
      ref="mapBackgroundContainerRef"
      :style="transformStyle"
  >
    <!-- ECharts 容器，背景透明 -->
    <div class="map-container" ref="mapContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { fetchTableData } from '@/api/query_data.js'
import { getSysConfigFormId } from "@/api/constant/form_constant.js";
import { useRouter } from 'vue-router';

// 如果需要进行坐标系转换，请安装并导入 coordtransform 库
// npm install coordtransform
// import coordtransform from 'coordtransform';

const mapContainer = ref(null)
const mapBackgroundContainerRef = ref(null) // 引用最外层容器
const router = useRouter();

// --- 调整接口：固定的初始缩放比率 ---
// 你可以通过修改这个值来调整整个地图的初始放大级别
const initialScale = ref(1.2); // 固定的初始缩放比率 (例如 1.2 表示 120%)

// --- 手动设置平移范围限制 ---
// 这些值表示地图可以从其中心点向任意方向平移的最大距离（以未缩放的像素为单位）。
// 你需要根据你的背景图大小和 initialScale 进行调整，以确保地图不会移出合理范围。
// 示例值，请根据实际效果调整：
const manualPanLimitX = ref(40); // 允许水平方向从中心平移的最大距离 (未缩放像素)
const manualPanLimitY = ref(6); // 允许垂直方向从中心平移的最大距离 (未缩放像素)


// 平移状态 (这些值会通过拖拽动态改变)
const offsetX = ref(0)
const offsetY = ref(0)

// 拖拽状态
const isDragging = ref(false)
const startMouseX = ref(0)
const startMouseY = ref(0)
const startOffsetX = ref(0) // 拖拽开始时的平移量
const startOffsetY = ref(0)

// 计算transform样式
const transformStyle = computed(() => {
  return {
    transform: `scale(${initialScale.value}) translate(${offsetX.value}px, ${offsetY.value}px)`,
    transformOrigin: 'center center', // 缩放中心点，容器中心
    cursor: isDragging.value ? 'grabbing' : 'grab', // 鼠标样式
  }
})

// 鼠标按下事件处理
const handleMouseDown = (event) => {
  isDragging.value = true
  startMouseX.value = event.clientX
  startMouseY.value = event.clientY
  startOffsetX.value = offsetX.value
  startOffsetY.value = offsetY.value
  // 阻止默认行为，避免拖拽时选中文字等
  event.preventDefault()
}

// 鼠标移动事件处理
const handleMouseMove = (event) => {
  if (!isDragging.value) return

  // 计算鼠标在屏幕上移动的距离 (像素)
  const dx = event.clientX - startMouseX.value
  const dy = event.clientY - startMouseY.value

  // 计算新的潜在偏移量 (在原始坐标系中)
  let newOffsetX = startOffsetX.value + dx / initialScale.value
  let newOffsetY = startOffsetY.value + dy / initialScale.value

  // --- 应用手动设置的平移限制 ---
  // newOffsetX 应该在 [-manualPanLimitX.value, manualPanLimitX.value] 之间
  // newOffsetY 应该在 [-manualPanLimitY.value, manualPanLimitY.value] 之间
  newOffsetX = Math.max(-manualPanLimitX.value, Math.min(manualPanLimitX.value, newOffsetX));
  newOffsetY = Math.max(-manualPanLimitY.value, Math.min(manualPanLimitY.value, newOffsetY));

  // 更新状态
  offsetX.value = newOffsetX
  offsetY.value = newOffsetY

  // 更新起始点，实现平滑拖拽
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  startOffsetX.value = offsetX.value; // 使用限制后的值更新起始偏移量
  startOffsetY.value = offsetY.value; // 使用限制后的值更新起始偏移量
}

// 鼠标松开事件处理
const handleMouseUp = () => {
  isDragging.value = false
}


let myChart = null; // 定义 ECharts 实例

onMounted(() => {
  const containerElement = mapBackgroundContainerRef.value; // 获取最外层容器
  const echartsContainerElement = mapContainer.value; // 获取 ECharts 容器

  if (!containerElement || !echartsContainerElement) {
    console.error('地图容器元素未找到')
    return
  }

  // 添加事件监听器
  containerElement.addEventListener('mousedown', handleMouseDown)
  // 监听window，即使鼠标移出容器也能继续拖拽
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)


  // 初始化 ECharts 实例，并设置背景透明
  myChart = echarts.init(echartsContainerElement, null, {
    backgroundColor: 'transparent' // 确保 ECharts 渲染的 canvas 背景是透明的
  })
  myChart.showLoading()

  fetch('/assets/maps/china-province.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(chinaJson => {
        echarts.registerMap('china', chinaJson)

        fetchTableData(1, 10, getSysConfigFormId("BASE_FORM_ID"), {})
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
                  // 因为我们通过外部CSS transform来控制整个容器的平移缩放
                  roam: false,

                  // !!! 关键修改：调整 geo 组件的位置和大小以对齐背景图 !!!
                  // 这些值是相对于 ECharts 容器的。
                  // 即使父容器被外部 CSS transform 缩放和平移，ECharts 内部的渲染仍然基于这些参数。
                  // 因此，你仍需要根据你的 `map21.jpg` 卫星图的实际内容和比例进行微调。
                  // 建议在 `initialScale` 确定后，再来微调这些参数。
                  left: '28.6%',
                  right: '28.6%',
                  top: '6%',
                  bottom: '19%',
                  zoom: 1.355, // ECharts 内部地图的缩放级别。
                  // 这个值与外部的 `initialScale` 是独立的，但会共同影响最终视觉效果。
                  // 如果外部 `initialScale` 增大了，你可能需要适当减小 `geo.zoom` 来避免过度放大。
                  center: [104.4, 35.7], // 初始中心点

                  label: {
                    show: true,
                    color: '#fff', // 省份名称颜色改为白色，在卫星图上更清晰
                    fontSize: 10
                  },
                  itemStyle: {
                    // !!! 关键修改：省份区域颜色设置为透明或半透明，以便看到下面的卫星图 !!!
                    areaColor: 'rgba(24, 144, 255, 0.1)', // 非常浅的蓝色半透明，可以看到卫星图
                    borderColor: 'none', // 省份边界颜色改为白色，与卫星图形成对比
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
                    symbolSize: 30,
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
                      color: '#00ffff', // 图钉标签颜色改为亮青色
                      fontSize: 16,
                      fontWeight: 'bold',
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
                    name: 'system',
                    query: {baseName, longitude, latitude}
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

  // 窗口大小改变时，ECharts 容器需要重新计算大小
  window.addEventListener('resize', () => myChart && myChart.resize())
})

// 组件卸载时移除事件监听器，避免内存泄漏
onUnmounted(() => {
  const containerElement = mapBackgroundContainerRef.value;
  if (containerElement) {
    containerElement.removeEventListener('mousedown', handleMouseDown);
  }
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('resize', () => myChart && myChart.resize());
  if (myChart) {
    myChart.dispose(); // 销毁 ECharts实例
  }
})
</script>

<style scoped>
/* 父容器，用于放置背景卫星图 */
.map-background-container {
  width: 100%;
  height: 82vh; /* 确保容器占满视口高度 */
  background-image: url('/images/map21.jpg'); /* 你的卫星图路径 */
  background-size: cover; /* 确保背景图覆盖整个容器，可能裁剪 */
  background-position: center; /* 背景图居中 */
  background-repeat: no-repeat; /* 不重复 */
  position: relative; /* 确保子元素可以相对于它定位 */
  overflow: hidden; /* 关键：隐藏超出容器的内容，防止出现滚动条 */
  /* transform 的过渡效果在这里可以保留，让平移更平滑 */
  transition: transform 0.01s ease-out; /* 稍微加快过渡，平移手感更好 */
  will-change: transform;
  /* 鼠标样式通过 computed 属性动态设置 */
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
