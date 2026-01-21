import { ref, shallowRef, watch } from 'vue';
import L from 'leaflet';
import { transformGeoJSONCoords } from '../utils/coordTransform';

export function useLayerManager(mapInstance) {
    // UI 绑定的图层列表 (响应式)
    const layerList = ref([]);
    // 内部存储 Leaflet 图层实例 (非响应式，性能优化)
    const layerInstances = new Map();

    /**
     * 初始化所有配置的图层
     * @param {Array} config - layerConfig.js 中的配置
     * @param {Object} rawData - 后端返回的 GeoJSON 数据
     */
    const initLayers = (config, rawData) => {
        if (!mapInstance.value) return;
        const map = mapInstance.value;

        layerList.value = []; // 重置列表

        config.forEach((cfg) => {
            // 1. 创建独立的 Pane (这是实现独立排序的关键)
            const paneName = `pane-${cfg.id}`;
            if (!map.getPane(paneName)) {
                map.createPane(paneName);
                map.getPane(paneName).style.zIndex = cfg.zIndex; // 设置初始 z-index
            }

            // 2. 筛选数据
            const layerFeatures = rawData.features.filter(cfg.filter);

            // 3. 坐标转换处理
            if (cfg.needTransform) {
                layerFeatures.forEach(f => {
                    // 注意：这会修改原始数据，生产环境建议深拷贝
                    f.geometry.coordinates = transformGeoJSONCoords(f.geometry.coordinates);
                });
            }

            // 4. 创建 Leaflet 图层
            const layer = L.geoJSON(layerFeatures, {
                pane: paneName, // 绑定到特定 Pane
                style: cfg.style,
                onEachFeature: (feature, layer) => {
                    if (cfg.popupTemplate) {
                        layer.bindPopup(cfg.popupTemplate(feature.properties));
                    }
                }
            });

            // 5. 存储实例
            layerInstances.set(cfg.id, layer);

            // 6. 根据默认配置决定是否添加到地图
            if (cfg.visible) {
                layer.addTo(map);
            }

            // 7. 生成 UI 状态数据
            layerList.value.push({
                id: cfg.id,
                name: cfg.name,
                visible: cfg.visible,
                paneName: paneName,
                count: layerFeatures.length
            });
        });

        // 初始化后进行一次排序
        reorderLayers(layerList.value);
    };

    // 切换显示/隐藏
    const toggleLayer = (id, isVisible) => {
        const layer = layerInstances.get(id);
        const map = mapInstance.value;
        if (!layer || !map) return;

        if (isVisible) {
            if (!map.hasLayer(layer)) map.addLayer(layer);
        } else {
            if (map.hasLayer(layer)) map.removeLayer(layer);
        }
    };

    // 排序逻辑 (被拖拽组件调用)
    const reorderLayers = (newSortedList) => {
        const map = mapInstance.value;
        if (!map) return;

        const baseZIndex = 400; // Leaflet overlay 默认起始点
        const total = newSortedList.length;

        // 列表第一个元素在最上面，z-index 应该最大
        newSortedList.forEach((item, index) => {
            const pane = map.getPane(item.paneName);
            if (pane) {
                // 倒序计算 z-index
                pane.style.zIndex = baseZIndex + (total - index) * 10;
            }
        });

        layerList.value = newSortedList;
    };

    return {
        layerList,
        initLayers,
        toggleLayer,
        reorderLayers
    };
}