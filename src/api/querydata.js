// utils/api.js
import request from '@/utils/request'; // 假设 request 是你封装的请求方法

/**
 * 获取分页数据的方法
 * @param {number} pageNo 当前页码
 * @param {number} pageSize 每页大小
 * @param {number} formId 表单ID
 * @param {object} queryFilters 查询过滤条件
 * @returns {Promise} 返回一个包含数据和总数的 Promise
 */
export function fetchTableData(pageNo, pageSize, formId, queryFilters) {
    return request({
        url: '/api/onlinecode/queryListPage',  // 后端接口路径
        method: 'post',
        data: {
            pageNo: pageNo,
            pageSize: pageSize,
            formId: formId,
            queryParamVOs: JSON.stringify(queryFilters)  // 将查询条件转换为 JSON 字符串
        }
    });
}

export function fetchDeviceFeatureValues(
    deviceId,
    featureName,
    featurevalue,
    startTime,
    endTime,
    pageNo = 1,
    pageSize = 1000
) {
    // 构建查询参数
    const queryFilters = [
        { key: 'device_id', value: [deviceId] },
        { key: 'feature_name', value: [featureName] },
        { key: 'timestamp', range: [startTime, endTime] },
        { key: 'feature_value', value: [featurevalue]}
    ];

    return request({
        url: '/api/onlinecode/queryListPage',
        method: 'post',
        data: {
            formId: 'device_feature_value_form',
            pageNo,
            pageSize,
            queryParamVOs: JSON.stringify(queryFilters)
        }
    }).then(response => {
        // 假设response.data格式为 { success: true, data: { records: [...] } }
        if (response.success) {
            return response.data.records || [];
        }
        throw new Error('获取设备特征值失败: ' + response.message);
    });
}