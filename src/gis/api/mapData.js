// src/api/mapData.js

// 1. 引入 data.json (使用 ?raw 以纯文本字符串形式导入，处理 NDJSON 格式)
import rawDataStr from './data.json?raw';

// 2. 解析数据：将字符串按行分割，并解析为 JSON 对象数组
const allFeatures = rawDataStr
    .trim() // 去除首尾空白
    .split('\n') // 按换行符分割
    .filter(line => line.trim() !== '') // 过滤掉空行
    .map((line, index) => {
        try {
            return JSON.parse(line);
        } catch (e) {
            console.warn(`解析 data.json 第 ${index + 1} 行失败:`, e);
            return null;
        }
    })
    .filter(item => item !== null); // 过滤掉解析失败的项

// 模拟网络延迟
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 辅助函数：将要素数组包装为 GeoJSON FeatureCollection 格式
const wrapFeatureCollection = (features) => ({
    type: "FeatureCollection",
    features: features || []
});

/**
 * 1. 获取区域数据 (Region)
 * 逻辑：从 data.json 解析的数据中，筛选 properties.typeName 为 '区域' 的要素
 */
export async function getRegionData() {
    await sleep(300); // 模拟网络延迟
    const features = allFeatures.filter(f => f.properties && f.properties.typeName === '区域');
    return wrapFeatureCollection(features);
}

/**
 * 2. 获取板块数据 (Block)
 * 逻辑：筛选 typeName 为 '板块' 的要素
 */
export async function getBlockData() {
    await sleep(400);
    const features = allFeatures.filter(f => f.properties && f.properties.typeName === '板块');
    return wrapFeatureCollection(features);
}

/**
 * 3. 获取表观病害数据 (Surface Disease)
 * 逻辑：筛选 typeName 为 '表观病害' 的要素
 */
export async function getSurfaceDiseaseData() {
    await sleep(600);
    const features = allFeatures.filter(f => f.properties && f.properties.typeName === '表观病害');
    return wrapFeatureCollection(features);
}

/**
 * 4. 获取内部病害数据 (Internal Disease)
 * 逻辑：筛选 typeName 为 '内部病害' 的要素
 */
export async function getInternalDiseaseData() {
    await sleep(800);
    const features = allFeatures.filter(f => f.properties && f.properties.typeName === '内部病害');
    return wrapFeatureCollection(features);
}

/**
 * 5. 获取病害标记数据 (Markers)
 * 逻辑：筛选 typeName 为 '病害标记' 的要素
 */
export async function getDiseaseMarkerData() {
    await sleep(200);
    const features = allFeatures.filter(f => f.properties && f.properties.typeName === '病害标记');
    return wrapFeatureCollection(features);
}