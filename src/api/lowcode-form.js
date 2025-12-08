import request from '@/utils/request.js'

// 表单常量定义
export const FORM_CONSTANTS = {
  BASE_FORM_ID: 'BASE_FORM_ID',
  UNIT_FORM_ID: 'UNIT_FORM_ID',
  DEVICE_FORM_ID: 'DEVICE_FORM_ID',
  POINT_FORM_ID: 'POINT_FORM_ID',
  FEATURE_TYPE_FORM_ID: 'FEATURE_TYPE_FORM_ID',
  FEATURE_DATA_FORM_ID: 'FEATURE_DATA_FORM_ID',
  PERIOD_FORM_ID: 'PERIOD_FORM_ID',
  REPAIR_RECORD_FORM_ID: 'REPAIR_RECORD_FORM_ID',
  SERVICE_CONFIG_FORM_ID: 'SERVICE_CONFIG_FORM_ID',
  FAULT_CONFIG_FORM_ID: 'FAULT_CONFIG_FORM_ID',
  DIAGNOSIS_FORM_ID: 'DIAGNOSIS_FORM_ID'
};

// 表单ID映射表
export const FORM_ID_MAP = {
  [FORM_CONSTANTS.BASE_FORM_ID]: 35,
  [FORM_CONSTANTS.UNIT_FORM_ID]: 23,
  [FORM_CONSTANTS.DEVICE_FORM_ID]: 24,
  [FORM_CONSTANTS.POINT_FORM_ID]: 36,
  [FORM_CONSTANTS.FEATURE_TYPE_FORM_ID]: 37,
  [FORM_CONSTANTS.FEATURE_DATA_FORM_ID]: 44,
  [FORM_CONSTANTS.PERIOD_FORM_ID]: 39,
  [FORM_CONSTANTS.REPAIR_RECORD_FORM_ID]: 51,
  [FORM_CONSTANTS.SERVICE_CONFIG_FORM_ID]: 52,
  [FORM_CONSTANTS.FAULT_CONFIG_FORM_ID]: 29,
  [FORM_CONSTANTS.DIAGNOSIS_FORM_ID]: 49
};

// 通用方法：通过常量名称获取 formId
export function getFormId(name) {
  return FORM_ID_MAP[name] || null;
}

// 系统字段列表，用于过滤
export const SYSTEM_FIELDS = [
  'creator', 'creatorId', 'updater', 'updaterId',
  'create_time', 'update_time', 'deleted', 'tenant_id'
];

// 过滤系统字段
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

// 获取查询类型的SQL对应符号
export function getQueryType(queryTypeKeyWord) {
  let queryType = '';
  switch (queryTypeKeyWord?.trim() || '') {
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
    default: queryType = "1"; break;
  }
  return queryType;
}

// 生成查询过滤条件
export function generateQueryFilters(filters) {
  const safeFilters = Array.isArray(filters) ? filters : [];
  let queryFilters = [];
  
  safeFilters.forEach(filter => {
    const queryTypeKeyWord = getQueryType(filter.queryType);
    
    if (filter.value !== undefined && filter.value !== null) {
      queryFilters.push({
        key: filter.key,
        value: filter.value,
        queryType: queryTypeKeyWord,
      });
    }
  });
  
  return queryFilters;
}

// 获取表单列表
export async function getFormList(params) {
  return request({
    url: '/lowcode/form/list',
    method: 'get',
    params
  });
}

// 获取表单详情
export async function getFormDetail(formId) {
  return request({
    url: `/lowcode/form/${formId}`,
    method: 'get'
  });
}

// 创建表单
export async function createForm(data) {
  return request({
    url: '/lowcode/form',
    method: 'post',
    data
  });
}

// 更新表单
export async function updateForm(formId, data) {
  return request({
    url: `/lowcode/form/${formId}`,
    method: 'put',
    data
  });
}

// 删除表单
export async function deleteForm(formId) {
  return request({
    url: `/lowcode/form/${formId}`,
    method: 'delete'
  });
}

// 获取表单数据（分页）
export async function fetchFormData(pageNo, pageSize, formId, filters) {
  // 生成查询条件
  const queryParamVOs = generateQueryFilters(filters);

  const res = await request({
    url: '/api/onlinecode/queryListPage',
    method: 'post',
    data: {
      pageNo,
      pageSize,
      formId,
      queryParamVOs: JSON.stringify(queryParamVOs)
    }
  });

  // 过滤掉系统字段
  if (res.data && res.data.list) {
    res.data.list = stripSystemFields(res.data.list);
  }
  return res;
}

// 获取单个数据详情
export async function fetchDataById(formId, id) {
  const res = await request({
    url: '/api/onlinecode/queryOneById',
    method: 'get',
    params: {
      formId,
      id
    }
  });
  return res.data || null;
}

// 提交表单数据
export async function submitFormData(formId, data) {
  return request({
    url: `/api/onlinecode/submitData`,
    method: 'post',
    data: {
      formId,
      data: JSON.stringify(data)
    }
  });
}

// 更新表单数据
export async function updateFormData(formId, id, data) {
  return request({
    url: `/api/onlinecode/updateData`,
    method: 'post',
    data: {
      formId,
      id,
      data: JSON.stringify(data)
    }
  });
}

// 删除表单数据
export async function deleteFormData(formId, id) {
  return request({
    url: `/api/onlinecode/deleteData`,
    method: 'post',
    data: {
      formId,
      id
    }
  });
}

// 获取动态子表数据
export async function fetchDynamicSubTable(formId, fieldName, id) {
  const res = await request({
    url: '/api/onlinecode/querydynamicTable',
    method: 'get',
    params: { formId, fieldName, id }
  });
  if (res.data && res.data.dynamicTable) {
    res.data.dynamicTable = stripSystemFields(res.data.dynamicTable);
  }
  return res;
}

// 批量获取子表数据
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

// 获取表单配置
export async function getFormConfig(formId) {
  return request({
    url: `/lowcode/form/config/${formId}`,
    method: 'get'
  });
}

// 导出表单数据
export async function exportFormData(formId, filters) {
  const queryParamVOs = generateQueryFilters(filters);
  
  return request({
    url: '/api/onlinecode/exportData',
    method: 'post',
    data: {
      formId,
      queryParamVOs: JSON.stringify(queryParamVOs)
    },
    responseType: 'blob'
  });
}
