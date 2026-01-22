// src/gis/core/useBaseMap.js
import { ref, shallowRef } from 'vue';
import L from 'leaflet';

const TIANDITU_KEY = '3e3a763817d43477525c90d458cf2f47';

const BASE_MAP_LIST = [
    // --- 1. 天地图 - 矢量 (默认底图) ---
    {
        key: 'tianditu_vec',
        name: '天地图-矢量',
        type: 'wgs84',
        url: `https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${TIANDITU_KEY}`,
        options: { subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], maxZoom: 18 },
        annotationUrl: `https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=${TIANDITU_KEY}`
    },
    // --- 2. 天地图 - 影像 ---
    {
        key: 'tianditu_img',
        name: '天地图-影像',
        type: 'wgs84',
        url: `https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${TIANDITU_KEY}`,
        options: { subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], maxZoom: 18 },
        annotationUrl: `https://t{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=${TIANDITU_KEY}`
    },
    // --- 3. 天地图 - 地形 (新增) ---
    {
        key: 'tianditu_ter',
        name: '天地图-地形',
        type: 'wgs84',
        url: `https://t{s}.tianditu.gov.cn/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk=${TIANDITU_KEY}`,
        options: { subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], maxZoom: 18 },
        annotationUrl: `https://t{s}.tianditu.gov.cn/DataServer?T=cta_w&x={x}&y={y}&l={z}&tk=${TIANDITU_KEY}`
    },
    // --- 4. 高德地图 ---
    {
        key: 'gaode_vec',
        name: '高德地图',
        type: 'gcj02',
        url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        options: { subdomains: ['1', '2', '3', '4'], maxZoom: 18 }
    },
    // --- 5. 谷歌地图 (新增) ---
    {
        key: 'google_vec',
        name: '谷歌地图',
        type: 'wgs84',
        // 注意：此地址在国内可能访问不稳定
        url: 'http://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        options: {
            subdomains: ['0', '1', '2', '3'],
            maxZoom: 20
        }
    },
    // --- 6. 海图 OpenSeaMap (新增) ---
    {
        key: 'openseamap',
        name: '海图 (OpenSeaMap)',
        type: 'wgs84',
        // OpenSeaMap 通常作为透明叠加层，这里作为底图背景可能为透明或纯色
        url: 'http://t1.openseamap.org/seamark/{z}/{x}/{y}.png',
        options: {
            maxZoom: 18
        }
    }
];

export function useBaseMap(mapInstance) {
    // 默认选中天地图矢量
    const currentBaseMapKey = ref(BASE_MAP_LIST[0].key);
    const currentTileLayer = shallowRef(null);
    const currentAnnotationLayer = shallowRef(null);
    const currentCrsType = ref(BASE_MAP_LIST[0].type);

    const setBaseMap = (key) => {
        if (!mapInstance.value) return;
        const map = mapInstance.value;
        const config = BASE_MAP_LIST.find(c => c.key === key);
        if (!config) return;

        // 移除旧图层
        if (currentTileLayer.value) map.removeLayer(currentTileLayer.value);
        if (currentAnnotationLayer.value) map.removeLayer(currentAnnotationLayer.value);

        // 添加主底图
        currentTileLayer.value = L.tileLayer(config.url, config.options).addTo(map);

        // 添加注记层 (如果有)
        if (config.annotationUrl) {
            currentAnnotationLayer.value = L.tileLayer(config.annotationUrl, {
                ...config.options,
                zIndex: 1 // 确保注记层在底图之上，但在业务图层之下
            }).addTo(map);
        }

        // 确保底图在最下层
        currentTileLayer.value.bringToBack();

        // 更新状态
        currentBaseMapKey.value = key;
        currentCrsType.value = config.type;
    };

    return { baseMapList: BASE_MAP_LIST, currentBaseMapKey, currentCrsType, setBaseMap };
}