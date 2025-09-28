// src/mock/diagnosisMock.js
function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

const SAMPLE = [
    { id: 1, component_id: '101', fault_knowledge_name: '轴承外圈故障', probability: 86, diagnosis_time: -1 },
    { id: 2, component_id: '101', fault_knowledge_name: '轴承外圈故障', probability: 72, diagnosis_time: -5 },
    { id: 3, component_id: '102', fault_knowledge_name: '对中不良',     probability: 58, diagnosis_time: -2 },
    { id: 4, component_id: '102', fault_knowledge_name: '转子不平衡',   probability: 41, diagnosis_time: -6 },
    { id: 5, component_id: '103', fault_knowledge_name: '转子不平衡',   probability: 93, diagnosis_time: -1 },
    { id: 6, component_id: '103', fault_knowledge_name: '松动',         probability: 33, diagnosis_time: -3 },
    { id: 7, component_id: '104', fault_knowledge_name: '对中不良',     probability: 76, diagnosis_time: -4 },
    { id: 8, component_id: '104', fault_knowledge_name: '轴承外圈故障', probability: 64, diagnosis_time:  0 },
];

// ★ 当 SAMPLE 与当前装置设备ID不匹配时，用这个候选表生成
const FAULT_POOL = ['轴承外圈故障', '对中不良', '转子不平衡', '松动', '润滑不足'];

/**
 * 获取 mock 的诊断数据：
 * 1) 先尝试用 SAMPLE 命中
 * 2) 若为空，则按传入的 deviceIds 动态生成最近 N 天的记录（确保页面有数据可渲染）
 * @param {string[]} deviceIds
 * @param {number} days
 * @returns {Promise<Array>}
 */
export async function mockDiagnoses(deviceIds = [], days = 7) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    // 先用 SAMPLE 尝试命中
    const rowsFromSample = SAMPLE.map(r => {
        const dt = new Date();
        dt.setDate(dt.getDate() + Number(r.diagnosis_time || 0));
        return { ...r, diagnosis_time: fmtDate(dt) };
    })
        .filter(r => new Date(r.diagnosis_time) >= since)
        .filter(r => deviceIds.length === 0 || deviceIds.includes(String(r.component_id)));

    if (rowsFromSample.length > 0) {
        return Promise.resolve(rowsFromSample);
    }

    // ★ 若命中为空：按当前装置的 deviceIds 动态生成数据
    const out = [];
    let idSeq = 10000;
    // 每个设备生成 1~3 条，分布在最近 days 天
    deviceIds.forEach((did, idx) => {
        const count = Math.min(3, Math.max(1, Math.floor((idx % 3) + 1))); // 1~3条
        for (let k = 0; k < count; k++) {
            const dayOffset = -((idx + k) % Math.max(1, days)); // 最近N天内的某天
            const dt = new Date();
            dt.setDate(dt.getDate() + dayOffset);
            const fault = FAULT_POOL[(idx + k) % FAULT_POOL.length];
            const probBase = 35 + ((idx * 13 + k * 17) % 60); // 35~94 之间
            out.push({
                id: idSeq++,
                component_id: String(did),
                fault_knowledge_name: fault,
                probability: probBase,
                diagnosis_time: fmtDate(dt),
            });
        }
    });

    return Promise.resolve(
        out.filter(r => new Date(r.diagnosis_time) >= since)
    );
}
