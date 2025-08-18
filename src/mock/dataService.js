// src/mock/dataService.js
// 单一出数方法：getBasePageData(baseId, { days })，后续替换真实接口即可
// 所有字段遵循你给的四张表结构（35/23/24/30），此处做了简化与聚合

const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const pick = (arr) => arr[rand(0, arr.length - 1)];
const nowISO = () => new Date().toISOString();

const FAULT_TYPES = [
    { id: 'F01', name: '轴承磨损' },
    { id: 'F02', name: '不平衡' },
    { id: 'F03', name: '对中不良' },
    { id: 'F04', name: '松动' }
];

function genBase(baseId = 1) {
    return {
        id: baseId,
        name: '青岛一号基地',
        adress: '山东省青岛市城阳区XX路88号',
        longitude: 120.38,
        latitude: 36.07,
        altitude: 12.3,
        time: new Date(Date.now() - rand(0, 6) * 3600 * 1000).toISOString(),
        status: pick(['Normal', 'Warning', 'Fault'])
    };
}

function genUnits(baseId, n = 8) {
    const types = ['泵站', '风机组', '传输线', '冷却站'];
    const models = ['A-200', 'B-330', 'C-120', 'D-450'];
    return Array.from({ length: n }).map((_, i) => {
        const id = 1000 + i;
        return {
            // online_table_23
            id,
            parent_site: String(baseId),
            site_name: '青岛一号基地',
            system_name: `装置-${i + 1}`,
            system_type: pick(types),
            system_code: `UNIT-${id}`,
            system_model: pick(models),
            manufacturer: pick(['华东机电', '北方重工', '精工动力']),
            install_date: '2023-05-01',
            system_status: pick(['Normal', 'Warning', 'Fault']),
            // 装置级指标（演示用）
            remaining_life: rand(15, 300),
            confidence_level: rand(70, 98) / 1.0,
        };
    });
}

function genDevices(baseId, units) {
    // 每装置 12~30 台设备
    const devs = [];
    units.forEach(u => {
        const count = rand(12, 30);
        for (let i = 0; i < count; i++) {
            const id = Number(`${u.id}${i}`);
            devs.push({
                // online_table_24
                id,
                parent_system: String(u.id),
                parent_site: String(baseId),
                device_name: `设备-${u.system_code}-${i + 1}`,
                component_code: `C-${id}`,
                component_type: pick(['轴承', '电机', '联轴器', '泵']),
                component_model: pick(['M-10', 'M-20', 'M-30']),
                manufacturer: pick(['华东机电', '北方重工', '精工动力']),
                install_date: '2023-06-01',
                status: pick(['Normal', 'Warning', 'Fault']),
                rated_power: rand(5, 80),
                design_life: 5,
                health_level: Math.max(0, Math.min(1, Math.random() * 0.6 + 0.35)), // 0~1
                remaining_life: rand(1, 365),
                confidence_level: rand(60, 98) / 1.0,
            });
        }
    });
    return devs;
}

function genDiagnoses(devices, days = 7) {
    // 近 days 天随机生成诊断记录（online_table_30）
    const out = [];
    const now = Date.now();
    devices.forEach(d => {
        const times = rand(0, Math.max(2, Math.floor(days / 3))); // 每设备 0~N 条
        for (let i = 0; i < times; i++) {
            const t = new Date(now - rand(0, days) * 24 * 3600 * 1000);
            const ft = pick(FAULT_TYPES);
            const prob = rand(20, 100);
            out.push({
                id: Number(`${d.id}${i}`),
                component_id: String(d.id),
                raw_file_id: String(rand(1, 999)),
                fault_knowledge_id: ft.id,
                fault_name: ft.name, // 展示名（便于前端）
                probability: prob,
                diagnosis_time: t.toISOString(),
                diagnosis_basis: '频域峰值上升，包络谱出现倍频成分',
                description: ''
            });
        }
    });
    // 排序：时间新→旧
    return out.sort((a, b) => new Date(b.diagnosis_time) - new Date(a.diagnosis_time));
}

function bucketize(arr, getter, buckets) {
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
            percent: +(cnt * 100 / total).toFixed(1)
        };
    });
}

export async function getBasePageData(baseId = 1, { days = 7, highProbThreshold = 70 } = {}) {
    // 模拟网络延迟
    await new Promise(r => setTimeout(r, 200));

    const base = genBase(baseId);
    const units = genUnits(baseId, 8);
    const devices = genDevices(baseId, units);
    const diagnoses = genDiagnoses(devices, days);

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
                lastDiag
            },
            health: {
                unitLevel: { remaining_life: u.remaining_life, confidence_level: u.confidence_level },
                deviceAgg: aggHealth
            },
            risk: { score: riskScore, level: riskLevel }
        };
    });

    // 左侧“装置风险榜”多视角
    const rankings = {
        byHighProbDevices: [...unitCards].sort((a, b) => b.diagSummary.highDevices - a.diagSummary.highDevices),
        byHighProbDiagnoses: [...unitCards].sort((a, b) => b.diagSummary.highCount - a.diagSummary.highCount),
        byShortRULShare: [...unitCards].sort((a, b) => a.health.deviceAgg.avgRUL - b.health.deviceAgg.avgRUL),
        byCoverageLag: [...unitCards].sort((a, b) => {
            // 近 N 天“未被诊断”比例（演示：平均诊断时间距今越大越滞后）
            const aLag = a.diagSummary.lastDiag ? (Date.now() - new Date(a.diagSummary.lastDiag)) : Infinity;
            const bLag = b.diagSummary.lastDiag ? (Date.now() - new Date(b.diagSummary.lastDiag)) : Infinity;
            return bLag - aLag;
        })
    };

    // KPI Freshness（中位诊断时间距今，小时）
    const recentTimes = unitCards.map(c => c.diagSummary.lastDiag).filter(Boolean).map(t => Date.now() - new Date(t).getTime());
    recentTimes.sort((x, y) => x - y);
    const mid = recentTimes.length ? recentTimes[Math.floor(recentTimes.length / 2)] : null;
    const freshnessHours = mid ? Math.round(mid / 3600000) : null;

    return {
        base,
        kpis: {
            unitsCount,
            devicesCount,
            diagnosisCount: diagInWindow.length,
            highProbCount: highProb.length,
            highProbDevices,
            inProgressFaults: '—',
            doneWorkorders: '—',
            freshnessHours
        },
        unitCards,
        deviceStats: { healthBuckets, rulBuckets },
        rankings,
        meta: { days, highProbThreshold }
    };

}



// === 任务评估：mock 当前基地下所有“装置”的可达性所需数据 ===
// 说明：这里以“装置（unit）”为评估主体，给出航速(节)与健康寿命(天)
const genSailingSpeedKn = () => {
    // 20% 概率无速度（用于“隐藏无速度”筛选演示）
    if (Math.random() < 0.2) return null;
    // 其余在 6~24 节之间
    return +(6 + Math.random() * (24 - 6)).toFixed(1);
};

/**
 * 获取基地下全部“装置”的评估数据
 * 返回：[{ id, name, status, sailing_speed, nextMaintenance }]
 */
export async function getAssessmentUnits(baseId = 1) {
    await new Promise(r => setTimeout(r, 120)); // 模拟网络延迟
    const units = genUnits(baseId, 8);
    return units.map(u => ({
        id: u.id,
        name: u.system_name,
        status: u.system_status,
        sailing_speed: genSailingSpeedKn(), // 节(kn)
        nextMaintenance: u.remaining_life    // 直接用装置剩余寿命（天）
    }));
}

