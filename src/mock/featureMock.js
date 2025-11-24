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
/** 获取真实的“最新特征值” */
import { fetchTableData } from '@/api/query_data.js'
import { getSysConfigFormId } from '@/api/constant/form_constant.js'

export async function getLatestFeatures(deviceId) {
    if (!deviceId) return []

    try {
        // 按设备ID查询特征表（FEATURE_DATA_FORM_ID）
        const queryParams = [
            { key: 'device_id', value: String(deviceId), queryType: '=' }
        ]

        const res = await fetchTableData(
            1,
            1000,
            getSysConfigFormId('FEATURE_DATA_FORM_ID'),
            queryParams
        )

        const list = res?.data?.list || []

        // 适配字段结构（保证与原 mock 格式一致）
        return list.map(item => ({
            id: item.id,
            name: item.alia_name || item.feature_alia_name || item.name || '—',
            value: item.latest_value ?? item.value ?? item.val ?? null,
            unit: item.feature_unit || item.unit || '',
            source: item.data_source || item.source || 'reported',
            ts:
                item.ts ||
                item.time ||
                item.collect_time ||
                item.report_time ||
                item.updated_at ||
                null
        }))
    } catch (error) {
        console.error('加载设备特征数据失败:', error)
        return []
    }
}

