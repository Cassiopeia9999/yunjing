<template>
  <div class="dashboard">
    <!-- 地图容器区域，占据整个空间 -->
    <div class="map-container-wrapper">
      <MapContainer @map-ready="handleMapReady" />
      
      <!-- 浮动控制面板容器 -->
      <div class="floating-controls">
        <!-- 底图切换控件 - 右上角，点击下拉 -->
        <div class="control-panel base-map-panel">
          <div 
            class="panel-header" 
            @click="toggleBaseMapPanel"
          >
            <span class="panel-icon">🗺️</span>
            <span class="panel-title">底图切换</span>
            <span class="panel-toggle" :class="{ expanded: isBaseMapPanelExpanded }">
              {{ isBaseMapPanelExpanded ? '▼' : '▶' }}
            </span>
          </div>
          <div 
            class="panel-content" 
            v-show="isBaseMapPanelExpanded"
          >
            <BaseMapSwitch
                v-if="mapInst"
                :map-instance="mapInst"
                @change-crs="handleCrsChange"
            />
          </div>
        </div>
        
        <!-- 业务图层管理控件 - 左上角，点击下拉 -->
        <div class="control-panel layer-management-panel">
          <div 
            class="panel-header" 
            @click="toggleLayerPanel"
          >
            <span class="panel-icon">📋</span>
            <span class="panel-title">图层管理</span>
            <span class="panel-toggle" :class="{ expanded: isLayerPanelExpanded }">
              {{ isLayerPanelExpanded ? '▼' : '▶' }}
            </span>
          </div>
          <div 
            class="panel-content layer-content" 
            v-show="isLayerPanelExpanded"
          >
            <LayerControl
                v-if="mapInst"
                :layers="layerList"
                @toggle="toggleLayer"
                @reorder="reorderLayers"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { shallowRef, ref, onMounted } from 'vue';
import MapContainer from '@/gis/components/MapContainer.vue';
import LayerControl from '@/gis/components/LayerControl.vue';
import BaseMapSwitch from '@/gis/components/BaseMapSwitch.vue';
import { useLayerManager } from '@/gis/core/useLayerManager.js';
import { BUSINESS_LAYERS_CONFIG } from '@/gis/config/layerConfig.js';
import L from 'leaflet';

const mapInst = shallowRef(null);
const { layerList, initLayers, toggleLayer, reorderLayers } = useLayerManager(mapInst);

// 控制面板展开状态
const isBaseMapPanelExpanded = ref(false);
const isLayerPanelExpanded = ref(false);

// 自定义瓦片图层实例
let customTileLayer = null;

// 测试GeoJSON数据
const testGeoJSONData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "coordinates": [
          [103.98198524355136, 30.656042039844614],
          [103.98198698978139, 30.65604266501561],
          [103.98198909922745, 30.65604295325885]
        ],
        "type": "LineString"
      },
      "properties": {
        "date": 1725961256828,
        "severity": "DL_NORMAL",
        "area": 0.07711241970092751,
        "typeName": "表观病害",
        "length": 0.3855620985046375,
        "disCode": "4",
        "archiveId": "",
        "disType": "横向裂缝",
        "imageUrl": "",
        "name": "2.4L-1",
        "id": 1134614,
        "status": "UNCHANGED"
      }
    }
  ]
};

// 地图加载完成
const handleMapReady = (map) => {
  mapInst.value = map;
  
  // 添加自定义瓦片图层
  addCustomTileLayer();
  
  // 初始化业务图层
  initLayers(BUSINESS_LAYERS_CONFIG, testGeoJSONData);
  
  // 调整地图视角以适配GeoJSON数据
  fitMapToGeoJSON();
};

// 添加自定义瓦片图层
const addCustomTileLayer = () => {
  if (!mapInst.value) return;
  
  // 移除已存在的自定义瓦片图层
  if (customTileLayer) {
    mapInst.value.removeLayer(customTileLayer);
  }
  
  // 添加新的自定义瓦片图层
  customTileLayer = L.tileLayer('https://home.gm-robot.com:9104/image/103919/image/tile/{z}/{x}/{y}.png', {
    maxZoom: 27,
    minZoom: 2,
    tileSize: 256,
    opacity: 0.8,
    attribution: 'Custom Tile Layer'
  }).addTo(mapInst.value);
  
  console.log('Custom tile layer added');
};

// 调整地图视角以适配GeoJSON数据
const fitMapToGeoJSON = () => {
  if (!mapInst.value) return;
  
  // 创建临时GeoJSON图层用于计算边界
  const tempLayer = L.geoJSON(testGeoJSONData);
  const bounds = tempLayer.getBounds();
  
  // 调整地图视角
  mapInst.value.fitBounds(bounds, { padding: [50, 50] });
  
  // 设置合适的缩放级别
  mapInst.value.setZoom(18);
  
  // 移除临时图层
  tempLayer.remove();
  
  console.log('Map view adjusted to fit GeoJSON data');
};

// 底图切换 (处理 WGS84 <-> GCJ02 逻辑)
const handleCrsChange = (crsType) => {
  console.log('坐标系变更为:', crsType);
  // 这里可以根据坐标系类型重新加载数据
};

// 切换底图面板展开状态
const toggleBaseMapPanel = () => {
  isBaseMapPanelExpanded.value = !isBaseMapPanelExpanded.value;
  // 如果展开底图面板，关闭图层面板
  if (isBaseMapPanelExpanded.value) {
    isLayerPanelExpanded.value = false;
  }
};

// 切换图层管理面板展开状态
const toggleLayerPanel = () => {
  isLayerPanelExpanded.value = !isLayerPanelExpanded.value;
  // 如果展开图层面板，关闭底图面板
  if (isLayerPanelExpanded.value) {
    isBaseMapPanelExpanded.value = false;
  }
};
</script>

<style scoped>
/* 重置默认样式，确保全屏显示 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 主容器，全屏显示 */
.dashboard {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f7fa;
}

/* 地图容器包装器，占据整个空间 */
.map-container-wrapper {
  flex: 1;
  position: relative;
  height: 100%;
  min-height: 100%;
  background-color: #e0e0e0;
}

/* 确保地图容器占据整个父元素空间 */
:deep(.map-view) {
  width: 100% !important;
  height: 100% !important;
  background-color: #f0f2f5;
}

/* 浮动控制面板容器 */
.floating-controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 让点击事件穿透到地图 */
  z-index: 1000;
}

/* 通用控制面板样式 */
.control-panel {
  position: absolute;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  pointer-events: auto; /* 恢复点击事件 */
  transition: all 0.3s ease;
}

/* 控制面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #e9ecef;
}

.panel-header:hover {
  background-color: #e9ecef;
}

/* 面板图标 */
.panel-icon {
  font-size: 18px;
}

/* 面板标题 */
.panel-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 面板展开/收起按钮 */
.panel-toggle {
  font-size: 12px;
  color: #666;
  transition: transform 0.3s ease;
}

.panel-toggle.expanded {
  transform: rotate(90deg);
}

/* 面板内容区域 */
.panel-content {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

/* 底图切换面板 - 右上角 */
.base-map-panel {
  top: 20px;
  right: 20px;
  min-width: 200px;
}

/* 图层管理面板 - 左上角 */
.layer-management-panel {
  top: 20px;
  left: 20px;
  min-width: 250px;
  max-width: 300px;
}

/* 图层内容区域 */
.layer-content {
  padding: 8px;
}

/* 自定义滚动条 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>