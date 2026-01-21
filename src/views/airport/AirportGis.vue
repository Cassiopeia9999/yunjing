<template>
  <div class="dashboard">
    <MapContainer @map-ready="handleMapReady" />

    <div class="controls">
      <BaseMapSwitch
          v-if="mapInst"
          :map-instance="mapInst"
          @change-crs="handleCrsChange"
      />

      <LayerControl
          v-if="mapInst"
          :layers="layerList"
          @toggle="toggleLayer"
          @reorder="reorderLayers"
      />
    </div>
  </div>
</template>

<script setup>
import { shallowRef } from 'vue';
import MapContainer from '@/gis/components/MapContainer.vue';
import LayerControl from '@/gis/components/LayerControl.vue';
import BaseMapSwitch from '@/gis/components/BaseMapSwitch.vue';
import { useLayerManager } from '@/gis/core/useLayerManager.js';

const mapInst = shallowRef(null);
const { layerList, initLayers, toggleLayer, reorderLayers } = useLayerManager(mapInst);

// 地图加载完成
const handleMapReady = (map) => {
  mapInst.value = map;
  // 初始化业务数据 (默认认为高德底图，需要纠偏)
  // initLayers(config, data);
};

// 底图切换 (处理 WGS84 <-> GCJ02 逻辑)
const handleCrsChange = (crsType) => {
  console.log('坐标系变更为:', crsType);
  // 这里可以调用 useLayerManager 中的 reloadData 方法重新加载数据
  // 如果当前是 'gcj02' 则开启纠偏，如果是 'wgs84' 则关闭纠偏
};
</script>