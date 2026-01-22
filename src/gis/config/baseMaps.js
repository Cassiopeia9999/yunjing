// src/gis/config/baseMaps.js

export const BASE_MAP_CONFIG = [
    {
        key: 'tianditu_vec',
        name: '天地图-矢量地图',
        type: 'wgs84',
        // 请替换为你自己的天地图Key
        url: 'https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47',
        options: {
            subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
            maxZoom: 18
        },
        // 天地图通常需要叠加注记层
        annotationUrl: 'https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47'
    },
    {
        key: 'tianditu_img',
        name: '天地图-卫星地图',
        type: 'wgs84',
        url: 'https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47',
        options: {
            subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
            maxZoom: 18
        },
        // 卫星图注记层
        annotationUrl: 'https://t{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47'
    },
    {
        key: 'tianditu_ter',
        name: '天地图-地形地图',
        type: 'wgs84',
        url: 'https://t{s}.tianditu.gov.cn/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47',
        options: {
            subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
            maxZoom: 18
        },
        // 地形图注记层
        annotationUrl: 'https://t{s}.tianditu.gov.cn/DataServer?T=cta_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47'
    },
    {
        key: 'tianditu_cva',
        name: '天地图-矢量注记',
        type: 'wgs84',
        url: 'https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=3e3a763817d43477525c90d458cf2f47',
        options: {
            subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
            maxZoom: 18
        }
    }
];
