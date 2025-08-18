// /src/mock/faultCenter.mock.js
// 独立的故障管理 mock 数据与查询函数（可随时替换为真实接口）

export const HIGH_PROB_THRESHOLD = 80; // 高概率阈值（%）

// ======= 模拟 3 张被关联表 =======
const t24_components = [
    { id: 'C-101', name: '给水泵-1', code: 'PUMP-1', system_name: '给水系统' },
    { id: 'C-102', name: '给水泵-2', code: 'PUMP-2', system_name: '给水系统' },
    { id: 'C-201', name: '冷却风机-1', code: 'FAN-1', system_name: '冷却系统' },
];

const t25_rawfiles = [
    { id: 'F-9001', file_name: '2025-08-18_12-20-01.dat', size_mb: 5.0 },
    { id: 'F-9002', file_name: '2025-08-18_12-30-01.dat', size_mb: 5.0 },
    { id: 'F-9010', file_name: '2025-08-17_09-30-01.dat', size_mb: 5.0 },
];

const t28_faults = [
    { id: 'FK-01', name: '轴承外圈磨损' },
    { id: 'FK-02', name: '对中偏差' },
    { id: 'FK-03', name: '转子不平衡' },
];

// ======= 主表：online_table_30 诊断结果 =======
// 备注：增加前端使用的 status 字段（unhandled/handling/closed）
const t30_diagnosis = Array.from({ length: 58 }).map((_, i) => {
    const comp = t24_components[i % t24_components.length];
    const fk = t28_faults[i % t28_faults.length];
    const rf = t25_rawfiles[i % t25_rawfiles.length];
    const prob = Math.round(40 + Math.random() * 60); // 40~100
    const now = Date.now() - i * 3600_000;            // 每条相隔1小时
    const statuses = ['unhandled', 'handling', 'closed'];
    const status = statuses[i % statuses.length];

    return {
        id: 10000 + i,
        component_id: comp.id,
        raw_file_id: rf.id,
        fault_knowledge_id: fk.id,
        probability: prob,
        diagnosis_time: new Date(now).toISOString(),
        diagnosis_basis: `特征指纹匹配：rms、kurtosis 等；阈值对比/相似度= ${(
            0.6 + Math.random() * 0.4
        ).toFixed(2)}`,
        description: i % 5 === 0 ? '巡检人员复测建议：下班前复核' : '',
        status, // 前端扩展
    };
});

// ======= 辅助：ID -> 名称解析 =======
const compMap = new Map(t24_components.map((d) => [d.id, d]));
const fileMap = new Map(t25_rawfiles.map((d) => [d.id, d]));
const faultMap = new Map(t28_faults.map((d) => [d.id, d]));

function resolveRow(r) {
    const c = compMap.get(r.component_id);
    const f = fileMap.get(r.raw_file_id);
    const fk = faultMap.get(r.fault_knowledge_id);
    return {
        ...r,
        component_name: c?.name || r.component_id,
        component_code: c?.code || '-',
        system_name: c?.system_name || '-',
        raw_file_name: f?.file_name || r.raw_file_id,
        fault_name: fk?.name || r.fault_knowledge_id,
    };
}

// ======= 查询与统计 =======
export async function fetchFaultPage({
                                         page = 1,
                                         pageSize = 10,
                                         keyword = '',
                                         dateRange = [], // [startISO, endISO]
                                         probRange = [0, 100], // [min, max]
                                         status = 'all', // all/unhandled/handling/closed
                                         highOnly = false,
                                     } = {}) {
    await wait(120); // 模拟网络延迟

    let list = t30_diagnosis.map(resolveRow);

    if (keyword?.trim()) {
        const k = keyword.trim().toLowerCase();
        list = list.filter(
            (d) =>
                d.fault_name.toLowerCase().includes(k) ||
                d.component_name.toLowerCase().includes(k) ||
                d.description?.toLowerCase().includes(k)
        );
    }

    if (dateRange?.length === 2) {
        const [s, e] = dateRange.map((x) => new Date(x).getTime());
        list = list.filter((d) => {
            const t = new Date(d.diagnosis_time).getTime();
            return t >= s && t <= e;
        });
    }

    if (probRange?.length === 2) {
        const [min, max] = probRange;
        list = list.filter((d) => d.probability >= min && d.probability <= max);
    }

    if (status !== 'all') {
        list = list.filter((d) => d.status === status);
    }

    if (highOnly) {
        list = list.filter((d) => d.probability >= HIGH_PROB_THRESHOLD);
    }

    const total = list.length;
    const pageList = list.slice((page - 1) * pageSize, page * pageSize);

    return {
        list: pageList,
        total,
    };
}

export async function fetchFaultStats() {
    await wait(60);
    const all = t30_diagnosis.map(resolveRow);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ts = todayStart.getTime();

    const total = all.length;
    const today = all.filter((d) => new Date(d.diagnosis_time).getTime() >= ts).length;
    const high = all.filter((d) => d.probability >= HIGH_PROB_THRESHOLD).length;
    const unhandled = all.filter((d) => d.status === 'unhandled').length;

    return {
        total,
        today,
        high,
        unhandled,
        threshold: HIGH_PROB_THRESHOLD,
    };
}

function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
