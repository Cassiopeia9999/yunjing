// src/utils/api.js

// formId 常量定义
export const BASE_FORM_ID = 'BASE_FORM_ID';  // 基地表单ID
export const FORM_ID_PRODUCTION_7784 = 'FORM_ID_PRODUCTION_7784';
export const FORM_ID_PRODUCTION_7800 = 'FORM_ID_PRODUCTION_7800';
export const UNIT_FORM_ID = 'UNIT_FORM_ID';  // 装置表单ID
export const DEVICE_FORM_ID = 'DEVICE_FORM_ID';  // 设备表单ID
export const POINT_FORM_ID = 'POINT_FORM_ID';  // 测点表单ID
export const FEATURE_TYPE_FORM_ID = 'FEATURE_TYPE_FORM_ID';  // 特征类型表单ID
export const FEATURE_DATA_FORM_ID = 'FEATURE_DATA_FORM_ID';
export const PERIOD_FORM_ID = 'PERIOD_FORM_ID';
export const Equipment_Characteristic_Data = 'Equipment_Characteristic_Data';
export const Real_Time_Device_Data = 'Real_Time_Device_Data';
export const SERVICE_CONFIG_FORM_ID = 'SERVICE_CONFIG_FORM_ID';
export const FAULT_CONFIG_FORM_ID = 'FAULT_CONFIG_FORM_ID';
export const DIAGNOSIS_FORM_ID = 'DIAGNOSIS_FORM_ID';



// formId 管理映射表
const FORM_ID_MAP = {
    [BASE_FORM_ID]: 35,
    [FORM_ID_PRODUCTION_7784]: 22,
    [FORM_ID_PRODUCTION_7800]: 23,
    [UNIT_FORM_ID]: 23,  // 装置
    [DEVICE_FORM_ID]: 24,  // 设备
    [POINT_FORM_ID]: 36,  // 测点
    [FEATURE_TYPE_FORM_ID]: 37,  // 特征类型
    [FEATURE_DATA_FORM_ID]: 44,
    [PERIOD_FORM_ID]: 39,
    [Equipment_Characteristic_Data]: 44,
    [Real_Time_Device_Data]: 42,
    [SERVICE_CONFIG_FORM_ID]: 52,
    [FAULT_CONFIG_FORM_ID]: 29,
    [DIAGNOSIS_FORM_ID]: 30



};

// 通用方法：通过常量名称获取 formId
export function getSysConfigFormId(name) {
    return FORM_ID_MAP[name];
}

// 导出常量和映射表
export {
    FORM_ID_MAP,
};
