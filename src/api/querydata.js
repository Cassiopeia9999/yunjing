// utils/api.js
import request from '@/utils/request'; // 假设 request 是你封装的请求方法
const SYSTEM_FIELDS = [
    'creator', 'creatorId', 'updater', 'updaterId',
    'create_time', 'update_time', 'deleted', 'tenant_id'
];

function stripSystemFields(obj) {
    if (Array.isArray(obj)) {
        return obj.map(stripSystemFields);
    }
    if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const key in obj) {
            if (!SYSTEM_FIELDS.includes(key)) {
                result[key] = stripSystemFields(obj[key]);
            }
        }
        return result;
    }
    return obj;
}

/**
 * 获取分页数据的方法
 * @param {number} pageNo 当前页码
 * @param {number} pageSize 每页大小
 * @param {number} formId 表单ID
 * @param {object} queryFilters 查询过滤条件
 * @returns {Promise} 返回一个包含数据和总数的 Promise
 */
export async function fetchTableData(pageNo, pageSize, formId, queryFilters) {
    const res = await request({
        url: '/api/onlinecode/queryListPage',
        method: 'post',
        data: {
            pageNo,
            pageSize,
            formId,
            queryParamVOs: JSON.stringify(queryFilters)
        }
    });
    res.data.list = stripSystemFields(res.data.list);
    return res;
}



export async function fetchDynamicSubTable(formId, fieldName, id) {
    const res = await request({
        url: '/api/onlinecode/querydynamicTable',
        method: 'get',
        params: { formId, fieldName, id }
    });
    res.data.dynamicTable = stripSystemFields(res.data.dynamicTable);
    return res;
}


export async function fetchSubDataBatch(formId, fieldName, reIds) {
    const res = await request({
        url: '/api/onlinecode/querySubDataBatch',
        method: 'post',
        data: {
            formId,
            fieldName,
            reIds: reIds.map(id => Number(id))
        }
    });
    const rawMap = res.data || {};
    const cleanMap = {};

    for (const key in rawMap) {
        cleanMap[key] = stripSystemFields(rawMap[key]);
    }

    return { data: cleanMap };
}

