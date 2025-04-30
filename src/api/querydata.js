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
