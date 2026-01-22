<template>
  <div class="gis-dashboard">
    <div class="map-wrapper">
      <MapContainer @map-ready="handleMapReady" />
    </div>

    <div class="header-bar">
      <div class="project-title">
        <div class="logo-icon">✈️</div>
        <div class="text-group">
          <h1>机场道面智慧管养平台</h1>
          <span class="subtitle">Digital Twin Pavement Management System</span>
        </div>
      </div>
      <div class="status-widget">
        <span class="status-dot online"></span> 实时监控中
      </div>
    </div>

    <div class="right-toolbar">

      <div class="tool-buttons">
        <button
            class="tool-btn"
            :class="{ active: activePanel === 'data' }"
            @click="togglePanel('data')"
            title="业务数据"
        >
          <span class="icon">📊</span>
          <span class="label">数据</span>
        </button>

        <button
            class="tool-btn"
            :class="{ active: activePanel === 'layer' }"
            @click="togglePanel('layer')"
            title="图层管理"
        >
          <span class="icon">📚</span>
          <span class="label">图层</span>
        </button>

        <button
            class="tool-btn"
            :class="{ active: activePanel === 'basemap' }"
            @click="togglePanel('basemap')"
            title="底图切换"
        >
          <span class="icon">🌍</span>
          <span class="label">底图</span>
        </button>
      </div>

      <transition name="slide-fade">
        <div class="panel-container" v-show="activePanel" style="width: 340px;">

          <div class="panel-header">
            <h3>{{ activePanelTitle }}</h3>
            <button class="close-btn" @click="closePanel">×</button>
          </div>

          <div class="panel-body custom-scroll" :class="{ 'no-padding': activePanel === 'data' }">

            <DataBoard
                v-if="activePanel === 'data'"
                :list="featureTableList"
                @locate="handleLocateFeature"
            />

            <LayerControl
                v-if="activePanel === 'layer' && mapInst"
                :layers="layerList"
                @toggle="toggleLayer"
                @reorder="reorderLayers"
            />

            <BaseMapSwitch
                v-if="activePanel === 'basemap'"
                :list="baseMapList"
                :current-key="currentBaseMapKey"
                @switch="handleBaseMapSwitch"
            />
          </div>
        </div>
      </transition>
    </div>

  </div>
</template>

<script setup>
import { shallowRef, ref, computed } from 'vue';
import MapContainer from '@/gis/components/MapContainer.vue';
import LayerControl from '@/gis/components/LayerControl.vue';
import BaseMapSwitch from '@/gis/components/BaseMapSwitch.vue';
// 引入新组件
import DataBoard from '@/gis/components/DataBoard.vue';

import { useLayerManager } from '@/gis/core/useLayerManager.js';
import { useBaseMap } from '@/gis/core/useBaseMap.js';
import { BUSINESS_LAYERS_CONFIG } from '@/gis/config/layerConfig.js';
import L from 'leaflet';

const mapInst = shallowRef(null);

// 解构出 featureTableList
const { layerList, featureTableList, initLayers, toggleLayer, reorderLayers } = useLayerManager(mapInst);
const { baseMapList, currentBaseMapKey, setBaseMap } = useBaseMap(mapInst);

const activePanel = ref('layer');

const activePanelTitle = computed(() => {
  if (activePanel.value === 'data') return '业务数据'; // 新增标题
  if (activePanel.value === 'layer') return '业务图层';
  if (activePanel.value === 'basemap') return '底图切换';
  return '';
});

const togglePanel = (panelName) => {
  activePanel.value = activePanel.value === panelName ? null : panelName;
};

const closePanel = () => {
  activePanel.value = null;
};

const handleMapReady = (map) => {
  mapInst.value = map;
  setBaseMap('tianditu_vec');
  initLayers(BUSINESS_LAYERS_CONFIG);
};

const handleBaseMapSwitch = (key) => {
  setBaseMap(key);
};

// 3. 处理列表点击定位
const handleLocateFeature = (item) => {
  if (!mapInst.value || !item.center) return;

  // 飞到目标点
  mapInst.value.flyTo([item.center.lat, item.center.lng], 18, {
    duration: 1.5
  });

  // 可选：创建一个高亮光圈或者打开 Popup
  // 简单的做法是打开 Popup，需要通过图层实例找到具体的 Layer，这里简化处理直接飞过去
  console.log('Locating:', item.name, item.center);
};
</script>

<style scoped>
/* 这里保留你原有的样式 */
.gis-dashboard {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #050a14;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.map-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
.header-bar {
  position: absolute; top: 0; left: 0; width: 100%; height: 80px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
  z-index: 10; display: flex; justify-content: space-between; align-items: center;
  padding: 0 30px; pointer-events: none;
}
.project-title { display: flex; align-items: center; gap: 15px; pointer-events: auto; }
.logo-icon { font-size: 32px; filter: drop-shadow(0 0 10px rgba(0,168,255,0.5)); }
.text-group h1 { margin: 0; font-size: 22px; color: #fff; font-weight: 600; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.text-group .subtitle { font-size: 12px; color: rgba(255,255,255,0.7); display: block; margin-top: 2px; text-transform: uppercase; }
.status-widget { color: rgba(255,255,255,0.9); font-size: 14px; background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 20px; backdrop-filter: blur(4px); pointer-events: auto; display: flex; align-items: center; gap: 8px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background-color: #52c41a; box-shadow: 0 0 8px #52c41a; }

.right-toolbar {
  position: absolute; top: 90px; right: 20px; z-index: 20;
  display: flex; align-items: flex-start; gap: 12px; flex-direction: row-reverse;
}
.tool-buttons { display: flex; flex-direction: column; gap: 12px; }
.tool-btn {
  width: 48px; height: 48px; border-radius: 8px; border: none;
  background: rgba(255, 255, 255, 0.9); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); color: #555;
}
.tool-btn:hover { background: #fff; transform: translateX(-2px); color: #1890ff; }
.tool-btn.active { background: #1890ff; color: white; }
.tool-btn .icon { font-size: 20px; line-height: 1; margin-bottom: 2px; }
.tool-btn .label { font-size: 10px; transform: scale(0.9); }

.panel-container {
  /* 这里由行内样式 style="width: 340px" 覆盖，但保留默认值 */
  width: 320px;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
  border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden; border: 1px solid rgba(255,255,255,0.5);
  display: flex; flex-direction: column; max-height: calc(100vh - 120px);
}
.panel-header {
  padding: 14px 16px; background: rgba(245, 247, 250, 0.8);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  display: flex; justify-content: space-between; align-items: center;
}
.panel-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #1f2937; }
.close-btn { background: none; border: none; font-size: 20px; color: #999; cursor: pointer; padding: 0 4px; }
.close-btn:hover { color: #333; }

.panel-body { padding: 12px; overflow-y: auto; }
/* DataBoard 不需要 padding，因为它自带 list 滚动 */
.panel-body.no-padding { padding: 0; }

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }

:deep(.layer-control-panel), :deep(.base-map-switch) {
  width: 100% !important; box-shadow: none !important;
  background: transparent !important; border-radius: 0 !important; padding: 0 !important;
}
:deep(.layer-control-panel .panel-header) { display: none !important; }
:deep(.layer-list) { max-height: none !important; }
</style>