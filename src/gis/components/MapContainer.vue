<template>
  <div id="map-container" class="map-view"></div>
</template>

<script setup>
import { onMounted, onUnmounted, shallowRef } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // 务必引入样式

// 定义 Emits，向外传递地图就绪事件
const emit = defineEmits(['map-ready']);

const map = shallowRef(null);

onMounted(() => {
  console.log('MapContainer onMounted called');
  
  try {
    // 1. 初始化地图实例
    map.value = L.map('map-container', {
      center: [29.562, 106.544], // 默认中心点 (重庆)
      zoom: 12, // 默认缩放级别
      zoomControl: false, // 隐藏默认缩放控件，方便自定义位置
      attributionControl: false, // 隐藏右下角版权信息
      layers: [] // 不添加默认底图，由BaseMapSwitch组件管理
    });

    console.log('Map instance created:', map.value);
    
    // 添加缩放控件到右下角
    L.control.zoom({ position: 'bottomright' }).addTo(map.value);
    
    // 添加地图加载事件监听，用于调试
    map.value.on('load', () => {
      console.log('Map loaded successfully');
    });
    
    // 2. 通知父组件地图已就绪
    emit('map-ready', map.value);
    console.log('Map ready event emitted');
  } catch (error) {
    console.error('Error initializing map:', error);
  }
});

// 销毁地图，防止内存泄漏
onUnmounted(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});
</script>

<style scoped>
.map-view {
  width: 100%;
  height: 100%; /* 父容器必须有高度 */
  background-color: #f0f2f5;
  z-index: 1;
}
</style>