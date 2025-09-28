// src/mock/featureMock.js
// 模拟“当前设备”的最新特征值（混合：解析/上报）
function iso(d) {
    return new Date(d).toISOString();
}
function daysAgo(n){ return iso(Date.now() - n*86400000); }

/**
 * @typedef {Object} FeatureRow
 * @prop {string} id
 * @prop {string} name
 * @prop {number|string} value
 * @prop {string} unit
 * @prop {'parsed'|'reported'} source
 * @prop {string} ts  // ISO 时间
 */

/** 获取 mock 的“最新特征值” */
export async function getLatestFeatures(deviceId) {
    const id = String(deviceId || 'X');
    // 你可以替换成自己的静态数组；这里只是示例
    /** @type {FeatureRow[]} */
    const list = [
        { id:`${id}-rms-X`,     name:'振动X RMS', value:3.21, unit:'mm/s', source:'parsed',   ts:daysAgo(0) },
        { id:`${id}-rms-Y`,     name:'振动Y RMS', value:3.14, unit:'mm/s', source:'parsed', ts:daysAgo(0) },
        { id:`${id}-rms-Z`,     name:'振动Z RMS', value:1.18, unit:'mm/s', source:'parsed', ts:daysAgo(0) },
        { id:`${id}-curr-X`,    name:'X加速度级',     value:108.9, unit:'dB',    source:'parsed',   ts:daysAgo(2) },
        { id:`${id}-curr-Y`,    name:'X加速度级',     value:108.9, unit:'dB',    source:'parsed',   ts:daysAgo(2) },
        { id:`${id}-curr-Z`,    name:'X加速度级',     value:108.9, unit:'dB',    source:'parsed',   ts:daysAgo(2) },
        { id:`${id}-kurt-p`,    name:'峭度',     value:3.7,  unit:'',     source:'parsed',   ts:daysAgo(3) },
        { id:`${id}-crest-p`,   name:'波峰因子', value:2.9,  unit:'',     source:'parsed',   ts:daysAgo(4) },
    ];
    return Promise.resolve(list);
}
