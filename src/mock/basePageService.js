import {
    BASE_FORM_ID,
    DEVICE_FORM_ID,
    DIAGNOSIS_FORM_ID,
    getSysConfigFormId,
    UNIT_FORM_ID
} from '@/api/constant/form_constant';
import { fetchDataById, fetchTableData } from '@/api/query_data.js';
import {bucketize, fetchDevices, fetchDiagnoses} from "@/mock/fetchDataApi.js";




/** ========= 新增：按基地分页拉取全部装置 =========
 *  直接使用后端字段结构（不做字段转换/猜测）
 *  返回值：后端 list 的直接拼接数组
 */
export async function fetchUnitsByBase(baseId, { pageSize = 100 } = {}) {
    let pageNo = 1;
    const all = [];

    while (true) {
        const res = await fetchTableData(
            pageNo,
            pageSize,
            getSysConfigFormId(UNIT_FORM_ID),
            [{ key: 'parent_site', queryType: '=', value: baseId }]
        );
        const list = (res && res.data && Array.isArray(res.data.list)) ? res.data.list : [];
        const total = (res && res.data && typeof res.data.total === 'number') ? res.data.total : list.length;

        all.push(...list);

        if (all.length >= total || list.length < pageSize) break;
        pageNo++;
    }

    return all;
}

// 获取基地数据
export async function getBasePageData(formId, baseId, { days = 7, highProbThreshold = 70 } = {}) {
    // 从后端接口获取基地数据
    const base = await fetchDataById(formId, baseId); // 调用通用方法获取单个数据

    if (!base) {
        throw new Error(`数据ID ${baseId} 不存在`);
    }

    // 获取装置数据
    const unitsRes = await fetchTableData(1, 100, getSysConfigFormId(UNIT_FORM_ID), [
        { key: 'parent_site', queryType: '=', value: baseId }
    ]);
    const units = unitsRes.data.list;

    // 获取设备数据
    const devices = await fetchDevices(baseId, units.map(u => u.id));

    // 获取诊断数据
    const diagnoses = await fetchDiagnoses(devices.map(d => d.id), days);

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

    // KPI
    const unitsCount = units.length;
    const devicesCount = devices.length;
    const diagInWindow = diagnoses.filter(r => {
        const dt = new Date(r.diagnosis_time);
        return dt >= new Date(Date.now() - days * 24 * 3600 * 1000);
    });
    const highProb = diagInWindow.filter(r => r.probability >= highProbThreshold);
    const highProbDevices = Array.from(new Set(highProb.map(r => r.component_id))).length;

    // 设备统计分布
    const healthBuckets = bucketize(
        devices,
        d => d.health_level,
        [
            { label: '0.0–0.3', min: 0.0, max: 0.3 },
            { label: '0.3–0.6', min: 0.3, max: 0.6 },
            { label: '0.6–0.8', min: 0.6, max: 0.8 },
            { label: '0.8–0.9', min: 0.8, max: 0.9 },
            { label: '0.9–1.0', min: 0.9, max: 1.01 }
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
    const unitCards = units.map(u => {
        const devs = deviceByUnit[u.id] || [];
        const rs = diagByUnit[u.id] || [];
        const rsIn = rs.filter(r => new Date(r.diagnosis_time) >= new Date(Date.now() - days * 24 * 3600 * 1000));
        const highIn = rsIn.filter(r => r.probability >= highProbThreshold);
        const highDevices = new Set(highIn.map(r => r.component_id)).size;

        const aggHealth = devs.length
            ? {
                avgHealth: +(devs.reduce((s, d) => s + d.health_level, 0) / devs.length).toFixed(2),
                avgRUL: Math.round(devs.reduce((s, d) => s + d.remaining_life, 0) / devs.length),
                avgConf: +(devs.reduce((s, d) => s + d.confidence_level, 0) / devs.length).toFixed(1),
            }
            : { avgHealth: 0, avgRUL: 0, avgConf: 0 };

        const lastDiag = rsIn[0]?.diagnosis_time || null;

        // 简易风险分（仅演示）
        const riskScore = Math.min(
            100,
            Math.round(highDevices * 10 + highIn.length * 2 + (u.system_status === 'Fault' ? 15 : u.system_status === 'Warning' ? 5 : 0))
        );
        const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'mid' : 'low';

        return {
            unit: u,
            diagSummary: {
                count: rsIn.length,
                highCount: highIn.length,
                highDevices,
                lastDiag,
            },
            health: {
                unitLevel: { remaining_life: u.remaining_life, confidence_level: u.confidence_level },
                deviceAgg: aggHealth,
            },
            risk: { score: riskScore, level: riskLevel },
        };
    });

    // 排序：高概率设备、高概率诊断、RUL短期、滞后
    const rankings = {
        byHighProbDevices: [...unitCards].sort((a, b) => b.diagSummary.highDevices - a.diagSummary.highDevices),
        byHighProbDiagnoses: [...unitCards].sort((a, b) => b.diagSummary.highCount - a.diagSummary.highCount),
        byShortRULShare: [...unitCards].sort((a, b) => a.health.deviceAgg.avgRUL - b.health.deviceAgg.avgRUL),
        byCoverageLag: [...unitCards].sort((a, b) => {
            const aLag = a.diagSummary.lastDiag ? Date.now() - new Date(a.diagSummary.lastDiag) : Infinity;
            const bLag = b.diagSummary.lastDiag ? Date.now() - new Date(b.diagSummary.lastDiag) : Infinity;
            return bLag - aLag;
        }),
    };

    // Freshness: 中位诊断时间距今，小时
    const recentTimes = unitCards.map(c => c.diagSummary.lastDiag).filter(Boolean).map(t => Date.now() - new Date(t).getTime());
    recentTimes.sort((x, y) => x - y);
    const mid = recentTimes.length ? recentTimes[Math.floor(recentTimes.length / 2)] : null;
    const freshnessHours = mid ? Math.round(mid / 3600000) : null;

    return {
        base: {
            name: base.name || '未知基地',
            status: base.status || '未知状态',
            address: base.address || '未知地址',
            longitude: base.longitude,
            latitude: base.latitude,
            time: base.update_time || '—',  // 如果没有时间，显示—
        },
        kpis: {
            unitsCount,
            devicesCount,
            diagnosisCount: diagInWindow.length,
            highProbCount: highProb.length,
            highProbDevices,
            freshnessHours,
        },
        unitCards,
        deviceStats: { healthBuckets, rulBuckets },
        rankings,
        meta: { days, highProbThreshold },
    };
}


