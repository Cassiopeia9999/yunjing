// src/gis/core/useLayerManager.js
import { ref } from 'vue';
import L from 'leaflet';
import { transformGeoJSONCoords } from '../utils/coordTransform';

export function useLayerManager(mapInstance) {
    // UI 绑定的图层列表 (响应式) - 用于控制图层开关
    const layerList = ref([]);

    // 【新增】UI 绑定的数据列表 (响应式) - 用于 DataBoard 展示所有要素详情
    const featureTableList = ref([]);

    // 内部存储 Leaflet 图层实例 (Map<id, layer>)
    const layerInstances = new Map();

    /**
     * 清理所有当前管理的图层 (用于重新加载配置前)
     */
    const clearLayers = () => {
        if (!mapInstance.value) return;
        const map = mapInstance.value;

        // 遍历所有已创建的图层实例并移除
        layerInstances.forEach((layer) => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
        layerInstances.clear();
        layerList.value = [];

        // 【新增】清理数据列表
        featureTableList.value = [];
    };

    /**
     * 内部方法：创建一个图层实体 (异步)
     */
    const createLayerEntity = async (map, cfg, paneName) => {
        // --- 分支 A: 瓦片图层 (Tile) ---
        if (cfg.type === 'tile') {
            return {
                layer: L.tileLayer(cfg.url, {
                    pane: paneName,
                    ...cfg.options
                }),
                count: 1
            };
        }

        // --- 分支 B: 矢量图层 (GeoJSON) ---
        if (cfg.type === 'geojson') {
            try {
                let features = [];

                // 1. 异步加载数据
                if (cfg.loader) {
                    const geoJSONData = await cfg.loader();
                    if (!geoJSONData || !geoJSONData.features) return null;
                    features = geoJSONData.features;
                } else {
                    return null;
                }

                // 2. 数据过滤
                if (cfg.filter) {
                    features = features.filter(cfg.filter);
                }

                // 3. 坐标纠偏
                if (cfg.needTransform && features.length > 0) {
                    features = JSON.parse(JSON.stringify(features));
                    features.forEach(f => {
                        f.geometry.coordinates = transformGeoJSONCoords(f.geometry.coordinates);
                    });
                }

                // 4. 【新增】提取数据到 featureTableList，供列表展示
                features.forEach(f => {
                    // 计算中心点 (用于列表点击时的定位)
                    // 使用临时 Layer 计算边界中心，这是一个通用的方法，支持 Point/Line/Polygon
                    const tempLayer = L.geoJSON(f);
                    const center = tempLayer.getBounds().getCenter();

                    featureTableList.value.push({
                        id: f.properties.id || Math.random().toString(36).substr(2, 9), // 确保有唯一ID
                        layerId: cfg.id,       // 所属图层ID
                        layerName: cfg.name,   // 所属图层名称
                        typeName: f.properties.typeName, // 业务类型
                        name: f.properties.name || f.properties.disType || '未命名要素', // 显示名称
                        severity: f.properties.severity, // 严重程度 (如果有)
                        status: f.properties.status,     // 状态 (如果有)
                        center: { lat: center.lat, lng: center.lng }, // 定位坐标
                        rawProps: f.properties // 保留原始属性备用
                    });
                });

                // 5. 创建 Leaflet GeoJSON 图层
                const layer = L.geoJSON(features, {
                    pane: paneName,
                    style: cfg.style,
                    onEachFeature: (feature, l) => {
                        if (cfg.popupTemplate) {
                            l.bindPopup(cfg.popupTemplate(feature.properties));
                        }
                        if (feature.properties.name) {
                            l.bindTooltip(feature.properties.name, { sticky: true });
                        }
                    },
                    // 自定义点标记样式
                    pointToLayer: (feature, latlng) => {
                        if (cfg.style && typeof cfg.style === 'function') {
                            const style = cfg.style(feature);
                            if (style.radius) {
                                return L.circleMarker(latlng, style);
                            }
                        }
                        return L.marker(latlng);
                    }
                });

                return { layer, count: features.length };

            } catch (error) {
                console.error(`图层 [${cfg.name}] 数据加载/创建失败:`, error);
                return null;
            }
        }
        return null;
    };

    /**
     * 初始化/重载图层
     */
    const initLayers = (config) => {
        if (!mapInstance.value) return;
        const map = mapInstance.value;

        // 1. 先清理
        clearLayers();

        // 2. 遍历配置
        config.forEach((cfg) => {
            const paneName = `pane-${cfg.id}`;
            if (!map.getPane(paneName)) {
                map.createPane(paneName);
            }
            map.getPane(paneName).style.zIndex = cfg.zIndex;

            // UI 列表占位
            const layerState = {
                id: cfg.id,
                name: cfg.name,
                visible: cfg.visible,
                zIndex: cfg.zIndex,
                paneName: paneName,
                count: 0,
                loading: true
            };
            layerList.value.push(layerState);

            // 异步创建
            createLayerEntity(map, cfg, paneName).then((result) => {
                layerState.loading = false;

                if (result && result.layer) {
                    layerInstances.set(cfg.id, result.layer);
                    layerState.count = result.count;

                    if (cfg.visible) {
                        result.layer.addTo(map);
                    }
                } else {
                    layerState.count = 0;
                }
            });
        });

        layerList.value.sort((a, b) => b.zIndex - a.zIndex);
    };

    /**
     * 切换图层显隐
     */
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

    /**
     * 图层拖拽排序
     */
    const reorderLayers = (newSortedList) => {
        const map = mapInstance.value;
        if (!map) return;

        const baseZIndex = 200;
        const total = newSortedList.length;

        newSortedList.forEach((item, index) => {
            const pane = map.getPane(item.paneName);
            if (pane) {
                const newZ = baseZIndex + (total - index) * 10;
                pane.style.zIndex = newZ;
                item.zIndex = newZ;
            }
        });

        layerList.value = newSortedList;
    };

    return {
        layerList,
        featureTableList, // 【关键新增】导出数据列表
        initLayers,
        toggleLayer,
        reorderLayers,
        clearLayers
    };
}