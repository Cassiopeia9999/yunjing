// feature_service.js

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


/**
 * 方法 3：获取某个通道的“原始波形”数据（Arrow 二进制流）
 *
 * 后端接口：/api/device/raw/wave/arrow
 * 入参：
 *  - deviceName:    设备名
 *  - collectTime:   "yyyy-MM-dd HH:mm:ss" （online_table_42.collect_time）
 *  - channelName:   通道名，比如 "EVA"
 *
 * 出参（解析后）：
 *  {
 *    channelName: "EVA",
 *    samples: [Float64...],
 *    points:  [{ idx:0, value:xxx }, ...],
 *    sampleCount: 12345
 *  }
 */
export async function fetchChannelWaveData(deviceName, collectTime, channelName) {
    const res = await request({
        url: '/api/device/raw/wave/arrow',
        method: 'POST',
        responseType: 'arraybuffer',
        data: {
            deviceName,
            collectTime,
            channelName
        }
    })

    // 直接把后端的 ArrayBuffer 丢给解析器
    return await parseChannelWaveArrowBuffer(res)
}


/**
 * 解析后端返回的 Arrow Stream (channelName + data[])
 *
 * 注意：
 *  - Arrow 的 schema 是：
 *      channelName: Utf8
 *      data:        List<Float8>
 *  - 一个响应流里可能有多个 batch
 *  - 每个 batch 可能有多行（通常1行），每行 data 是该通道一段连续样本
 *  - 我们需要把这些段拼起来
 */
export async function parseChannelWaveArrowBuffer(buffer) {
    try {
        const uint8 = new Uint8Array(buffer)

        // 跟 safeParseArrowStreamBuffer 一样，留个预览方便调试
        const previewText = new TextDecoder().decode(uint8.slice(0, 100))
        console.log('[🔍 波形Arrow流预览]', previewText)

        // 用 Arrow Streaming Reader 解析
        const reader = await RecordBatchReader.from(uint8)
        const batches = await reader.readAll()

        let channelName = null
        let samples = []

        for (const batch of batches) {
            // 1. 拿列
            // 后端按 saveArrowFile() 设计：channelName + data
            // 但我们也兜底 channel 列名（万一写入时用的是 "channel"）
            let chCol = batch.getChild('channelName')
            if (!chCol) {
                chCol = batch.getChild('channel')
            }
            const dataCol = batch.getChild('data')

            if (!dataCol) {
                console.error(
                    '[❌ parseChannelWaveArrowBuffer] Arrow schema 不符合预期。batch.columns =',
                    batch.schema.fields.map(f => f.name)
                )
                throw new Error('波形 Arrow 缺少 data 列，无法解析')
            }

            const rowCount = batch.numRows
            for (let row = 0; row < rowCount; row++) {
                // 2. 取 channelName
                if (chCol && channelName == null) {
                    const ch = chCol.get(row)        // string，例如 "EVAE"
                    if (ch != null && ch !== 'null') {
                        channelName = ch
                    }
                }

                // 3. 取 data
                // dataCol 是 List<Float8>，dataCol.get(row) 期望得到 [Number,...]
                const arr = dataCol.get(row)

                if (Array.isArray(arr)) {
                    samples = samples.concat(arr)
                } else if (arr && typeof arr.toArray === 'function') {
                    // 某些 arrow 版本会给 TypedArray / Vector-like
                    samples = samples.concat(Array.from(arr.toArray()))
                } else if (arr != null) {
                    // 防御：最后一层兜底
                    samples = samples.concat(Array.from(arr))
                }
            }
        }

        // 4. 生成 points 方便画图 (x 为样本序号, y 为值)
        const points = samples.map((v, idx) => ({
            idx,
            value: v
        }))

        return {
            channelName,
            samples,
            points,
            sampleCount: samples.length
        }
    } catch (err) {
        console.error('❌ Arrow Stream 解析失败 (wave):', err)
        throw new Error('解析通道波形 Arrow 流失败，请检查后端返回格式。')
    }
}



