import {
    getSysConfigFormId,
    UNIT_FORM_ID
} from '@/api/constant/form_constant';
import { fetchDataById, fetchTableData } from '@/api/querydata';
import { bucketize, fetchDevices /* , fetchDiagnoses */ } from "@/mock/fetchDataApi.js";
import { mockDiagnoses } from "@/mock/diagnosisMock.js"; // ★ 使用 mock 诊断

/** 工具函数 */
function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}
function groupBy(arr, keyFn) {
    return arr.reduce((m, it) => {
        const k = keyFn(it);
        (m[k] ||= []).push(it);
        return m;
    }, {});
}
function mapProbToLevel(prob) {
    if (prob == null) return 'Low';
    if (prob >= 90) return 'Critical';
    if (prob >= 70) return 'High';
    if (prob >= 40) return 'Medium';
    return 'Low';
}

/**
 * 获取装置页面数据（使用 mock 诊断数据）
 * @param {number|string} unitId
 * @param {{days:number, highProbThreshold:number}} opts
 * @returns {Promise<object>}
 */
export async function getUnitPageData(unitId = 1, opts = { days: 7, highProbThreshold: 70 }) {
    // 1) 装置信息
    const unit = await fetchDataById(getSysConfigFormId(UNIT_FORM_ID), unitId);
    if (!unit) {
        throw new Error(`装置ID ${unitId} 不存在`);
    }

    // 2) 设备列表
    const devices = await fetchDevices(unit.parent_site.value, [unitId]); // 根据装置ID获取设备
    const deviceIds = devices.map(d => String(d.id));

    // 3) 诊断（mock）
    const diagnoses = await mockDiagnoses(deviceIds, opts.days);

    // 4) 聚合（基本保持你的写法）
    const deviceByUnit = devices.reduce((m, d) => {
        (m[d.parent_system] ||= []).push(d);
        return m;
    }, {});

    const diagByUnit = diagnoses.reduce((m, r) => {
        const dev = devices.find(d => String(d.id) === String(r.component_id));
        if (!dev) return m;
        (m[dev.parent_system] ||= []).push(r);
        return m;
    }, {});

    const devicesCount = devices.length;
    const since = new Date(Date.now() - opts.days * 24 * 3600 * 1000);

    const diagInWindow = diagnoses.filter(r => new Date(r.diagnosis_time) >= since);
    const highProb = diagInWindow.filter(r => (r.probability ?? 0) >= opts.highProbThreshold);
    const highProbDevices = Array.from(new Set(highProb.map(r => r.component_id))).length;

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

    const aggHealth = devices.length
        ? {
            avgHealth: +(devices.reduce((s, d) => s + (d.health_level ?? 0), 0) / devices.length).toFixed(2),
            avgRUL: Math.round(devices.reduce((s, d) => s + (d.remaining_life ?? 0), 0) / devices.length),
            avgConf: +(devices.reduce((s, d) => s + (d.confidence_level ?? 0), 0) / devices.length).toFixed(1),
        }
        : { avgHealth: 0, avgRUL: 0, avgConf: 0 };

    const rsIn = diagByUnit[unitId] || [];
    const highIn = rsIn.filter(r => (r.probability ?? 0) >= opts.highProbThreshold);
    const highDevices = new Set(highIn.map(r => r.component_id)).size;
    const lastDiag = rsIn[0]?.diagnosis_time || null;

    const riskScore = Math.min(
        100,
        Math.round(
            highDevices * 10 + highIn.length * 2 + (unit.system_status === 'Fault' ? 15 : unit.system_status === 'Warning' ? 5 : 0)
        )
    );
    const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'mid' : 'low';

    // 5) charts（右侧三张图）
    // 5.1 故障知识分布
    const byFault = groupBy(diagInWindow, r => r.fault_knowledge_name || '未命名故障');
    const diagDist = Object.keys(byFault)
        .map(name => {
            const arr = byFault[name];
            const high = arr.filter(x => (x.probability ?? 0) >= opts.highProbThreshold).length;
            const highShare = arr.length ? Math.round((high / arr.length) * 100) : 0;
            return { name, value: arr.length, highShare };
        })
        .sort((a, b) => b.value - a.value);

    // 5.2 告警等级占比（用概率 → 等级映射做演示）
    const byLv = groupBy(diagInWindow, r => mapProbToLevel(r.probability));
    const alarmDist = ['Critical', 'High', 'Medium', 'Low'].map(lv => ({
        level: lv,
        count: (byLv[lv] || []).length
    }));

    // 5.3 诊断趋势（按日统计）
    const dayBuckets = {};
    for (let i = opts.days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 3600 * 1000);
        dayBuckets[fmtDate(d)] = 0;
    }
    diagInWindow.forEach(r => {
        const k = fmtDate(new Date(r.diagnosis_time));
        if (Object.prototype.hasOwnProperty.call(dayBuckets, k)) {
            dayBuckets[k] += 1;
        }
    });
    const diagTrend = {
        dates: Object.keys(dayBuckets),
        counts: Object.values(dayBuckets)
    };

    // 6) 返回（尽量保持你原结构；修正 kpis 命名 diagCount 以匹配页面）
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
            diagCount: diagInWindow.length,     // ← 页面使用 {{ kpis.diagCount }}
            highProbCount: highProb.length,
            highProbDevices,
        },
        charts: {
            diagDist,     // [{ name, value, highShare }]
            alarmDist,    // [{ level, count }]
            diagTrend     // { dates:[], counts:[] }
        },
        freshnessHours: lastDiag ? Math.round((Date.now() - new Date(lastDiag).getTime()) / 3600000) : null,
    };
}
