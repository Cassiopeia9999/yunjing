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
 * @param {object} filters 查询过滤条件
 * @returns {Promise} 返回一个包含数据和总数的 Promise
 */
// 修改后的 fetchTableData 方法
export async function fetchTableData(pageNo, pageSize, formId, filters) {
    // 生成查询条件
    const queryParamVOs = generateQueryFilters(filters);

    const res = await request({
        url: '/api/onlinecode/queryListPage',
        method: 'post',
        data: {
            pageNo,
            pageSize,
            formId,
            queryParamVOs: JSON.stringify(queryParamVOs)  // 使用生成的查询过滤条件
        }
    });

    // 过滤掉系统字段
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

// 获取单个数据的详细信息
export async function fetchDataById(formId, id) {
    const res = await request({
        url: '/api/onlinecode/queryOneById',
        method: 'get',
        params: {
            formId: formId,  // 动态传入表单ID
            id: id           // 动态传入数据ID
        }
    });
    return res.data || null;
}


export function getQueryType(queryTypeKeyWord) {
    let queryType = '';
    switch (queryTypeKeyWord.trim()) {
        case "=": queryType = "1"; break;
        case "!=": queryType = "2"; break;
        case ">": queryType = "3"; break;
        case ">=": queryType = "4"; break;
        case "<": queryType = "5"; break;
        case "<=": queryType = "6"; break;
        case "in": queryType = "7"; break;
        case "not in": queryType = "8"; break;
        case "like": queryType = "9"; break;
        case "is null": queryType = "10"; break;
        case "is not null": queryType = "11"; break;
        case "not like": queryType = "12"; break;
        default: queryType = "1"; break; // Default to "=" if the operator is unrecognized
    }
    return queryType;
}


export function generateQueryFilters(filters) {
// 确保 filters 是数组，处理 null/undefined/非数组的情况
    const safeFilters = Array.isArray(filters) ? filters : [];
    let queryFilters = [];
    // 传入的 filters 是一个数组，每个元素包含 { key, value, queryType }
    safeFilters.forEach(filter => {
        // 获取 queryType 的 SQL 对应符号
        const queryTypeKeyWord = getQueryType(filter.queryType);

        if (filter.value !== undefined && filter.value !== null) {
            queryFilters.push({
                key: filter.key,  // 字段名
                value: filter.value,  // 字段的值
                queryType: queryTypeKeyWord,  // 转换为对应的 SQL 操作符
            });
        }
    });

    return queryFilters;
}