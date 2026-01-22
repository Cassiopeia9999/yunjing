<template>
  <div id="map-container" class="map-view"></div>
</template>

<script setup>
import { onMounted, onUnmounted, shallowRef, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 定义 Props，支持外部传入初始位置
const props = defineProps({
  center: {
    type: Array,
    default: () => [30.656042, 103.981985] // 默认成都
  },
  zoom: {
    type: Number,
    default: 20
  }
});

const emit = defineEmits(['map-ready']);

const map = shallowRef(null);
const mousePositionControl = shallowRef(null);

onMounted(() => {
  try {
    // 1. 初始化地图实例
    map.value = L.map('map-container', {
      center: props.center, // 使用 Props
      zoom: props.zoom,     // 使用 Props
      zoomControl: false,
      attributionControl: false,
      layers: []
    });

    // 2. 添加缩放控件
    L.control.zoom({ position: 'bottomright' }).addTo(map.value);

    // 3. 添加比例尺
    L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false,
      maxWidth: 200
    }).addTo(map.value);

    // 4. 自定义鼠标位置控件
    const MousePosition = L.Control.extend({
      options: {
        position: 'bottomright',
        separator: ' , ',
        lngFirst: false,
        prefix: '经纬度: '
      },

      onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
        L.DomEvent.disableClickPropagation(this._container);
        map.on('mousemove', this._onMouseMove, this);
        // 初始化显示中心点
        this._updateHTML(map.getCenter());
        return this._container;
      },

      onRemove: function (map) {
        map.off('mousemove', this._onMouseMove, this);
      },

      _onMouseMove: function (e) {
        this._updateHTML(e.latlng);
      },

      _updateHTML: function (latlng) {
        if (!latlng) return;
        const lat = latlng.lat.toFixed(6);
        const lng = latlng.lng.toFixed(6);
        // 去掉了 "坐标系: WGS84" 的硬编码，防止切换到底图时产生误导
        const value = this.options.lngFirst ?
            `${lng}${this.options.separator}${lat}` :
            `${lat}${this.options.separator}${lng}`;

        this._container.innerHTML = `${this.options.prefix}${value}`;
      }
    });

    mousePositionControl.value = new MousePosition();
    map.value.addControl(mousePositionControl.value);

    // 5. 通知父组件
    emit('map-ready', map.value);

  } catch (error) {
    console.error('Error initializing map:', error);
  }
});

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
  height: 100%;
  background-color: #050a14; /* 改为深色背景，配合整体风格 */
  z-index: 1;
}

/* 鼠标位置控件样式 */
:deep(.leaflet-control-mouseposition) {
  background-color: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(4px); /* 增加毛玻璃效果 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
  padding: 4px 10px !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  font-family: Consolas, Monaco, monospace; /* 使用等宽字体，数字跳动不抖动 */
  color: #333 !important;
  margin-right: 10px !important;
  margin-bottom: 10px !important;
  font-weight: 600 !important;
  /* 移除固定宽度，改为自适应，或者保留固定宽度但稍微改小 */
  min-width: 200px;
  text-align: center;
  user-select: all; /* 允许用户复制经纬度 */
}

/* 比例尺控件样式 */
:deep(.leaflet-control-scale) {
  margin-left: 20px !important;
  margin-bottom: 20px !important;
  border: none !important;
}

:deep(.leaflet-control-scale-line) {
  background: rgba(255,255,255,0.8) !important;
  border: 1px solid #999 !important;
  border-top: none !important;
  color: #333 !important;
  font-weight: 600 !important;
}
</style>