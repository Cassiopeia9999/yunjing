// src/gis/config/layerConfig.js

// 1. 引入独立的加载函数
import {
    getRegionData,
    getBlockData,
    getSurfaceDiseaseData,
    getInternalDiseaseData,
    getDiseaseMarkerData
} from '@/gis/api/mapData.js';

// 辅助函数：根据严重程度获取颜色
const getSeverityColor = (severity) => {
    const colors = {
        'DL_WORST': '#ff4d4f',  // 严重 - 红
        'DL_MEDIUM': '#faad14', // 一般 - 黄
        'DL_NORMAL': '#1890ff', // 轻微 - 蓝
        'default': '#52c41a'    // 其他 - 绿
    };
    return colors[severity] || colors['default'];
};

export const BUSINESS_LAYERS_CONFIG = [
    // ==========================================
    // 1. 瓦片图层 (Tile Layers) - 实景底图
    // ==========================================
    // 瓦片图层不需要 loader，因为 Leaflet 会根据 url 自动加载图片

    // 1.1 高清实景
    {
        id: 'hd_reality',
        name: '高清实景',
        type: 'tile',
        zIndex: 200,
        visible: true,
        url: 'https://home.gm-robot.com:9104/image/103919/image/tile/{z}/{x}/{y}.png',
        options: {
            maxZoom: 27,
            minZoom: 2,
            opacity: 1.0,
            tileSize: 256,
            crossOrigin: 'anonymous'
        }
    },

    // 1.2 空中实景
    {
        id: 'aerial_reality',
        name: '空中实景',
        type: 'tile',
        zIndex: 210,
        visible: false,
        url: 'https://your-server.com/aerial-layer/{z}/{x}/{y}.png', // 请替换真实地址
        options: {
            maxZoom: 24,
            minZoom: 2,
            opacity: 1.0,
            crossOrigin: 'anonymous'
        }
    },

    // ==========================================
    // 2. 矢量图层 (GeoJSON Layers) - 业务数据
    // ==========================================
    // 所有的矢量图层都增加 loader 属性

    // 2.1 区域 (Region)
    {
        id: 'layer_region',
        name: '区域',
        type: 'geojson',
        zIndex: 400,
        visible: true,
        needTransform: true,
        loader: getRegionData, // <--- 绑定加载函数
        filter: (feature) => feature.properties.typeName === '区域',
        style: () => ({
            color: '#722ed1',
            weight: 2,
            fillColor: '#722ed1',
            fillOpacity: 0.1
        }),
        popupTemplate: (props) => `<b>区域名称:</b> ${props.name}`
    },

    // 2.2 板块 (Block)
    {
        id: 'layer_block',
        name: '板块',
        type: 'geojson',
        zIndex: 410,
        visible: true,
        needTransform: true,
        loader: getBlockData, // <--- 绑定加载函数
        filter: (feature) => feature.properties.typeName === '板块',
        style: () => ({
            color: '#13c2c2',
            weight: 2,
            fillColor: '#13c2c2',
            fillOpacity: 0.2,
            dashArray: '5, 5'
        }),
        popupTemplate: (props) => `<b>板块编号:</b> ${props.name}`
    },

    // 2.3 表观病害 (Surface Disease)
    {
        id: 'surface_disease',
        name: '表观病害',
        type: 'geojson',
        zIndex: 500,
        visible: true,
        needTransform: true,
        loader: getSurfaceDiseaseData, // <--- 绑定加载函数
        filter: (feature) => feature.properties.typeName === '表观病害',
        style: (feature) => ({
            color: 'white',
            weight: 1,
            fillColor: getSeverityColor(feature.properties.severity),
            fillOpacity: 0.8
        }),
        popupTemplate: (props) => `
            <div>
                <b>${props.disType}</b><br/>
                等级: ${props.severity}
            </div>
        `
    },

    // 2.4 内部病害 (Internal Disease)
    {
        id: 'internal_disease',
        name: '内部病害',
        type: 'geojson',
        zIndex: 510,
        visible: false,
        needTransform: true,
        loader: getInternalDiseaseData, // <--- 绑定加载函数
        filter: (feature) => feature.properties.typeName === '内部病害',
        style: () => ({
            color: '#eb2f96',
            weight: 2,
            fillOpacity: 0.4,
            dashArray: '10, 5'
        }),
        popupTemplate: (props) => `<b>隐患类型:</b> ${props.disType}`
    },

    // 2.5 病害标记 (Marker/Point)
    {
        id: 'disease_marker',
        name: '病害标记',
        type: 'geojson',
        zIndex: 600,
        visible: true,
        needTransform: true,
        loader: getDiseaseMarkerData, // <--- 绑定加载函数
        filter: (feature) => feature.properties.typeName === '病害标记',
        style: () => ({
            radius: 6,
            fillColor: "#ff0000",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }),
        popupTemplate: (props) => `<b>重点标记:</b> ${props.note || props.name}`
    }
];