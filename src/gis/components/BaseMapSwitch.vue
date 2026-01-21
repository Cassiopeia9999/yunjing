<template>
  <div class="base-map-switch">
    <div
        v-for="item in BASE_MAP_CONFIG"
        :key="item.key"
        class="map-btn"
        :class="{ active: currentKey === item.key }"
        @click="changeBaseMap(item)"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import { BASE_MAP_CONFIG } from '@/gis/config/baseMaps';

const props = defineProps({
  mapInstance: {
    type: Object, // Leaflet Map 实例
    required: false // 初始可能为空
  }
});

const emit = defineEmits(['change-crs']); // 发出坐标系变更事件

const currentKey = ref(BASE_MAP_CONFIG[0].key);
const currentLayer = ref(null);
const annotationLayer = ref(null); // 用于天地图注记

// 切换底图核心逻辑
const changeBaseMap = (config) => {
  if (!props.mapInstance) return;
  const map = props.mapInstance;

  currentKey.value = config.key;

  // 1. 移除旧图层
  if (currentLayer.value) map.removeLayer(currentLayer.value);
  if (annotationLayer.value) map.removeLayer(annotationLayer.value);

  // 2. 创建新图层
  currentLayer.value = L.tileLayer(config.url, config.options).addTo(map);

  // 2.1 如果有注记层 (如天地图)
  if (config.annotationUrl) {
    annotationLayer.value = L.tileLayer(config.annotationUrl, {
      ...config.options,
      zIndex: 1 // 注记要在底图之上
    }).addTo(map);
  }

  // 3. 将新底图推送到最底层 (避免遮挡业务图层)
  currentLayer.value.bringToBack();

  // 4. 通知父组件坐标系类型 (决定是否需要对业务数据进行纠偏)
  emit('change-crs', config.type); // 'gcj02' 或 'wgs84'
};

// 监听 map 实例就绪，初始化默认底图
watch(() => props.mapInstance, (newMap) => {
  if (newMap) {
    changeBaseMap(BASE_MAP_CONFIG[0]);
  }
});
</script>

<style scoped>
.base-map-switch {
  background: white;
  padding: 4px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  display: flex;
  gap: 4px;
}

.map-btn {
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 3px;
  color: #555;
  transition: all 0.2s;
}

.map-btn:hover { background: #f3f4f6; }

.map-btn.active {
  background: #1890ff;
  color: white;
  font-weight: 500;
}
</style>