// src/gis/config/baseMaps.js

export const BASE_MAP_CONFIG = [
    {
        key: 'gaode_vec',
        name: '高德地图',
        type: 'gcj02', // 标识坐标系，用于后续判断是否纠偏
        url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        options: {
            subdomains: ['1', '2', '3', '4'],
            minZoom: 3,
            maxZoom: 20
        }
    },
    {
        key: 'gaode_img',
        name: '高德卫星',
        type: 'gcj02',
        url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        options: {
            subdomains: ['1', '2', '3', '4'],
            minZoom: 3,
            maxZoom: 20
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