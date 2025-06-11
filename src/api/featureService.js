// featureService.js

import request from '@/utils/request'
import { tableFromIPC } from 'apache-arrow'

/**
 * 方法 1：获取 Arrow 格式特征数据，并解析为 JS 对象数组
 */
/**
 * 方法 1：获取 Arrow 格式特征数据（需解析）
 */
export async function fetchParsedFeatureData(deviceName, featureName, startTime, endTime) {
    const res = await request({
        url: '/api/device/feature/arrow/download',
        method: 'POST',
        responseType: 'arraybuffer',
        data: {
            deviceName,
            featureName,
            startTime,
            endTime
        }
    })

    return await safeParseArrowStreamBuffer(res);
}
/**
 * 方法 2：获取 JSON 格式特征数据（无需 Arrow 解析）
 */

export async function fetchFeatureDataAsJson(deviceName, featureName, startTime, endTime) {
    const res = await request({
        url: '/api/device/feature/query',
        method: 'POST',
        data: {
            deviceName,
            featureName,
            startTime,
            endTime
        }
    })

    return (res.data.records || []).map(row => ({
        cur_timestamp: row.timestamp,
        feature_value: row.value
    }))
}


/**
 * 安全解析 Arrow buffer，返回标准数据结构。
 * @param {ArrayBuffer} buffer 后端返回的 Arrow 二进制数据
 * @returns {Object[]} 解析后的对象数组，每个对象应包含 timestamp 和 value 字段
 */


import { RecordBatchReader } from 'apache-arrow'

export async function safeParseArrowStreamBuffer(buffer) {
    try {
        const uint8 = new Uint8Array(buffer);

        const previewText = new TextDecoder().decode(uint8.slice(0, 100));
        console.log('[🔍 Arrow 流预览]', previewText);

        const reader = await RecordBatchReader.from(uint8);
        const batches = await reader.readAll();

        const records = [];

        for (const batch of batches) {
            const tsCol = batch.getChild('timestamp');
            const valCol = batch.getChild('value');

            const rowCount = batch.numRows;

            for (let i = 0; i < rowCount; i++) {
                const ts = tsCol.get(i); // 可能是毫秒数或字符串
                records.push({
                    cur_timestamp: Number(ts),
                    feature_value: valCol.get(i)
                });
            }
        }

        return records;
    } catch (err) {
        console.error('❌ Arrow Stream 解析失败:', err);
        throw new Error('解析 Arrow Stream 格式失败，请检查后端数据结构。');
    }
}

// ⏰ 时间格式化函数：支持传入毫秒或字符串
export function formatTimestamp(input) {
    let date
    if (typeof input === 'number') {
        date = new Date(input)
    } else if (typeof input === 'string' && /^\d+$/.test(input)) {
        date = new Date(parseInt(input))
    } else if (typeof input === 'string') {
        date = new Date(input)
    } else {
        return input
    }

    const yyyy = date.getFullYear()
    const MM = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')

    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`
}


