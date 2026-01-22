// src/gis/config/baseMaps.js

export const BASE_MAP_CONFIG = [
    {
        key: 'openstreetmap',
        name: 'OpenStreetMap',
        type: 'wgs84', // 标识坐标系，用于后续判断是否纠偏
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            subdomains: ['a', 'b', 'c'],
            minZoom: 3,
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }
    },
    {
        key: 'tianditu_vec',
        name: '天地图',
        type: 'wgs84',
        // 请替换为你自己的天地图Key
        url: 'https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47',
        options: {
            subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
            maxZoom: 18
        },
        // 天地图通常需要叠加注记层，这里简化处理，仅展示底图
        annotationUrl: 'https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47'
    }
];
