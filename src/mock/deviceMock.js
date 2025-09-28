import { fetchDevices, fetchDiagnoses } from "@/mock/fetchDataApi.js";
import { fetchDataById, fetchTableData } from '@/api/querydata';
import { DEVICE_FORM_ID, DIAGNOSIS_FORM_ID, getSysConfigFormId } from '@/api/constant/form_constant';
/**
 * Helper function to pad a number to two digits
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
    return String(n).padStart(2, '0');
}


/**
 * 获取设备页面数据，动态从服务端获取数据
 * @param {number|string} deviceId
 * @param {{days:number, highProbThreshold:number}} opts
 * @returns {Promise<object>}
 */
/**
 * 获取设备页面数据（mock）
 * @param {number|string} deviceId
 * @param {{days:number}} opts
 * @returns {Promise<object>}
 */
export async function getDevicePageData(deviceId = 1, { days = 365 } = {}) {
    const now = new Date();

    // 设备基本信息
    const device = await fetchDataById(getSysConfigFormId(DEVICE_FORM_ID), deviceId);
    if (!device) throw new Error(`设备ID ${deviceId} 不存在`);

    // 诊断原始数组（仍然保留，用于“诊断记录”和“概率趋势”等）
    const diagnoses = await fetchDiagnoses([deviceId], days);

    // 父级信息
    const parents = {
        system_name: `装置-${device.parent_system}`,
        site_name: `基地-${device.parent_site}`,
    };

    const highProbThreshold = 70;

    // === 新：构造“最新快照 = 一次诊断，含多条故障” ===
    // 从 diagnoses 里挑一批最新的、概率靠前的作为本次快照的故障项
    const snapshotTime = fmt(new Date(now.getTime() - randint(0, days) * 86400000));
    const sortedByProb = [...diagnoses].sort((a,b) => (b.probability||0) - (a.probability||0));

    // 本次诊断包含 1~4 条故障
    const faultCount = Math.max(1, Math.min(4, randint(1, 4)));
    const faults = sortedByProb.slice(0, faultCount).map((d, idx) => ({
        id: d.id ?? (100000 + idx),
        fault_name: d.fault_type.name || '未定义故障',
        probability: d.probability ?? 0,
        diagnosis_basis_short: d.diagnosis_basis ? String(d.diagnosis_basis).slice(0, 60) : '',
        diagnosis_basis: d.diagnosis_basis || '',
        raw_file_id: d.raw_file_id || ''
    }));

    const snapshot = { diagnosis_time: snapshotTime, faults };

    // 诊断记录列表（仍然按天倒序渲染）
    const records = diagnoses.map((diag, i) => {
        const d = new Date(now.getTime() - i * 86400000);
        return {
            id: 10000 + i,
            diagnosis_time: fmt(d),
            fault_name: diag.fault_name || '未定义故障',
            probability: diag.probability || 0,
            description:
                (diag.probability || 0) > 85 ? '建议尽快检修'
                    : (diag.probability || 0) > 70 ? '建议重点观察'
                        : '—',
            diagnosis_basis: diag.diagnosis_basis || '未定义依据',
            raw_file_id: diag.raw_file_id || '未定义',
            confirmed: Math.random() > 0.8,
        };
    });

    // 规则提示（示例）
    const highCount = records.slice(0, 5).filter(r => (r.probability ?? 0) >= highProbThreshold).length;
    const riskTips = [];
    if (highCount >= 3) riskTips.push(`最近 <b>${highCount}</b> 次诊断高概率，<b>建议升级为故障</b>。`);
    if (device.remaining_life < 60 && device.health_level < 70) riskTips.push('RUL < 60 且健康度较低，建议进入观察与复测。');

    // 概率趋势（仍然用模拟点）
    const count = days === 7 ? 7 : 30;
    const pts = Array.from({ length: count }).map((_, i) => {
        const d = new Date(now.getTime() - (count - 1 - i) * 86400000);
        return { date: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, prob: randint(20, 96) };
    });

    // QA
    const qa = Math.random() < 0.2
        ? { passed: false, block: true, msg: '关键特征缺失/时钟漂移' }
        : { passed: true,  block: false, msg: '' };

    return {
        meta: { highProbThreshold },
        device,
        parents,
        snapshot,                    // ★ 改成 { diagnosis_time, faults: [...] }
        records,
        riskTips,
        charts: { probTrend: { dates: pts.map(p => p.date), probs: pts.map(p => p.prob) } },
        qa
    };
}


/**
 * Helper function to format the date into a string
 * @param {Date} d
 * @returns {string}
 */
function fmt(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Helper function to generate a random integer between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
