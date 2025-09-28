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
        { id:`${id}-rms-p`,     name:'振动RMS', value:3.21, unit:'mm/s', source:'parsed',   ts:daysAgo(0) },
        { id:`${id}-rms-r`,     name:'振动RMS', value:3.18, unit:'mm/s', source:'reported', ts:daysAgo(0) },
        { id:`${id}-temp-p`,    name:'温度',     value:62.4, unit:'℃',    source:'parsed',   ts:daysAgo(1) },
        { id:`${id}-temp-r`,    name:'温度',     value:63.1, unit:'℃',    source:'reported', ts:daysAgo(0) },
        { id:`${id}-curr-p`,    name:'电流',     value:11.2, unit:'A',    source:'parsed',   ts:daysAgo(2) },
        { id:`${id}-speed-r`,   name:'转速',     value:1480, unit:'RPM',  source:'reported', ts:daysAgo(0) },
        { id:`${id}-kurt-p`,    name:'峭度',     value:3.7,  unit:'',     source:'parsed',   ts:daysAgo(3) },
        { id:`${id}-crest-p`,   name:'波峰因子', value:2.9,  unit:'',     source:'parsed',   ts:daysAgo(4) },
        { id:`${id}-acc-r`,     name:'加速度峰值', value:12.4, unit:'m/s²', source:'reported', ts:daysAgo(1) },
        { id:`${id}-disp-r`,    name:'位移峰峰', value:35.2, unit:'μm',   source:'reported', ts:daysAgo(2) },
        { id:`${id}-noise-p`,   name:'噪声',     value:68.0, unit:'dB',   source:'parsed',   ts:daysAgo(0) },
        { id:`${id}-press-r`,   name:'油压',     value:0.62, unit:'MPa',  source:'reported', ts:daysAgo(1) },
    ];
    return Promise.resolve(list);
}
