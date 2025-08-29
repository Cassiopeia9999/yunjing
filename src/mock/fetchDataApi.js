
import {
    BASE_FORM_ID,
    DEVICE_FORM_ID,
    DIAGNOSIS_FORM_ID,
    getSysConfigFormId,
    UNIT_FORM_ID
} from '@/api/constant/form_constant';
import { fetchDataById, fetchTableData } from '@/api/querydata';


// 获取设备数据
export async function fetchDevices(baseId, unitIds) {
    const allDevices = [];
    for (const unitId of unitIds) {
        const res = await fetchTableData(1, 200, getSysConfigFormId(DEVICE_FORM_ID), [
            { key: 'parent_system', queryType: '=', value: unitId },
            { key: 'parent_site', queryType: '=', value: baseId },
        ]);
        allDevices.push(...res.data.list);
    }
    return allDevices;
}


// 获取诊断数据（从服务端获取）
export async function fetchDiagnoses(deviceIds, days) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const res = await fetchTableData(1, 500, getSysConfigFormId(DIAGNOSIS_FORM_ID), [
        { key: 'component_id', queryType: 'in', value: deviceIds },
        { key: 'diagnosis_time', queryType: '>=', value: since },
    ]);
    return res.data.list;
}


// 获取装置数据（并调用后端 API）
export async function getAssessmentUnits(baseId = 1) {
    // 从后端接口获取装置数据
    const res = await fetchTableData(1, 100, getSysConfigFormId(UNIT_FORM_ID), [
        { key: 'parent_site', queryType: '=', value: baseId }
    ]);
    const units = res.data.list;

    // 生成装置评估数据
    return units.map(u => ({
        id: u.id,
        name: u.system_name,
        status: u.system_status,
        sailing_speed: u.sailing_speed, // 航速（节）
        nextMaintenance: u.remaining_life, // 剩余寿命（天）
    }));
}

// 获取基地列表（新增方法）
export async function getBaseList() {
    const res = await fetchTableData(1, 100, getSysConfigFormId(BASE_FORM_ID), []);
    return res.data.list || [];
}


// 健康度分布桶化
export  function bucketize(arr, getter, buckets) {
    const total = arr.length || 1;
    return buckets.map(b => {
        const cnt = arr.filter(x => {
            const v = getter(x);
            if (b.max === undefined) return v >= b.min;
            return v >= b.min && v < b.max;
        }).length;
        return {
            label: b.label,
            count: cnt,
            percent: +(cnt * 100 / total).toFixed(1),
        };
    });
}



