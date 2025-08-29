import {
    BASE_FORM_ID,
    DEVICE_FORM_ID,
    DIAGNOSIS_FORM_ID,
    getSysConfigFormId,
    UNIT_FORM_ID
} from '@/api/constant/form_constant';
import { fetchDataById, fetchTableData } from '@/api/querydata';
import {bucketize, fetchDevices, fetchDiagnoses} from "@/mock/fetchDataApi.js";
/**
 * 获取装置页面数据，动态从服务端获取数据
 * @param {number|string} unitId
 * @param {{days:number, highProbThreshold:number}} opts
 * @returns {Promise<object>}
 */
export async function getUnitPageData(unitId = 1, opts = { days: 7, highProbThreshold: 70 }) {
    // 获取装置的基础信息
    const unit = await fetchDataById(getSysConfigFormId(UNIT_FORM_ID), unitId);
    if (!unit) {
        throw new Error(`装置ID ${unitId} 不存在`);
    }

    // 获取装置的设备数据
    const devices = await fetchDevices(unit.parent_site.value, [unitId]); // 根据装置ID获取设备数据

    // 获取装置下的诊断数据
    const diagnoses = await fetchDiagnoses(devices.map(d => d.id), opts.days); // 过滤出诊断时间在指定天数范围内的数据

    // 获取装置下的所有设备，聚合设备数据
    const deviceByUnit = devices.reduce((m, d) => {
        (m[d.parent_system] ||= []).push(d);
        return m;
    }, {});

    const diagByUnit = diagnoses.reduce((m, r) => {
        const dev = devices.find(d => String(d.id) === r.component_id);
        if (!dev) return m;
        (m[dev.parent_system] ||= []).push(r);
        return m;
    }, {});

    // KPI 计算（单个装置级别）
    const devicesCount = devices.length;
    const diagInWindow = diagnoses.filter(r => {
        const dt = new Date(r.diagnosis_time);
        return dt >= new Date(Date.now() - opts.days * 24 * 3600 * 1000);
    });
    const highProb = diagInWindow.filter(r => r.probability >= opts.highProbThreshold);
    const highProbDevices = Array.from(new Set(highProb.map(r => r.component_id))).length;

    // 设备健康度分布
    const healthBuckets = bucketize(
        devices,
        d => d.health_level,
        [
            { label: '0.0–0.3', min: 0.0, max: 0.3 },
            { label: '0.3–0.6', min: 0.3, max: 0.6 },
            { label: '0.6–0.8', min: 0.6, max: 0.8 },
            { label: '0.8–0.9', min: 0.8, max: 0.9 },
            { label: '0.9–1.0', min: 0.9, max: 1.0 }
        ]
    );

    const rulBuckets = bucketize(
        devices,
        d => d.remaining_life,
        [
            { label: '0–7天', min: 0, max: 7 },
            { label: '7–30天', min: 7, max: 30 },
            { label: '30–90天', min: 30, max: 90 },
            { label: '90–180天', min: 90, max: 180 },
            { label: '≥180天', min: 180 }
        ]
    );

    // 装置卡片聚合（诊断摘要 + 健康汇总）
    const aggHealth = devices.length
        ? {
            avgHealth: +(devices.reduce((s, d) => s + d.health_level, 0) / devices.length).toFixed(2),
            avgRUL: Math.round(devices.reduce((s, d) => s + d.remaining_life, 0) / devices.length),
            avgConf: +(devices.reduce((s, d) => s + d.confidence_level, 0) / devices.length).toFixed(1),
        }
        : { avgHealth: 0, avgRUL: 0, avgConf: 0 };

    // 获取诊断信息：计算高概率诊断设备数和设备的健康统计信息
    const rsIn = diagByUnit[unitId] || [];
    const highIn = rsIn.filter(r => r.probability >= opts.highProbThreshold);
    const highDevices = new Set(highIn.map(r => r.component_id)).size;

    const lastDiag = rsIn[0]?.diagnosis_time || null;

    // 简易风险分（仅演示）
    const riskScore = Math.min(
        100,
        Math.round(highDevices * 10 + highIn.length * 2 + (unit.system_status === 'Fault' ? 15 : unit.system_status === 'Warning' ? 5 : 0))
    );
    const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'mid' : 'low';

    // 返回装置详细数据
    return {
        unit,
        devices,
        diagSummary: {
            count: rsIn.length,
            highCount: highIn.length,
            highDevices,
            lastDiag,
        },
        health: {
            unitLevel: { remaining_life: unit.remaining_life, confidence_level: unit.confidence_level },
            deviceAgg: aggHealth,
        },
        risk: { score: riskScore, level: riskLevel },
        deviceStats: { healthBuckets, rulBuckets },
        kpis: {
            devicesCount,
            diagnosisCount: diagInWindow.length,
            highProbCount: highProb.length,
            highProbDevices,
        },
        rankings: {
            byHighProbDevices: [unit].sort((a, b) => b.diagSummary.highDevices - a.diagSummary.highDevices),
            byHighProbDiagnoses: [unit].sort((a, b) => b.diagSummary.highCount - a.diagSummary.highCount),
            byShortRULShare: [unit].sort((a, b) => a.health.deviceAgg.avgRUL - b.health.deviceAgg.avgRUL),
        },
        freshnessHours: highIn.length > 0 ? Math.round((Date.now() - new Date(lastDiag).getTime()) / 3600000) : null,
    };
}




