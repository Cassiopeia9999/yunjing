// src/mock/maintenanceMock.js
// —— 所有维修决策页数据都从这里取 ——

// 工具
const pad = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 1) 页面初始数据：装置状态 + 可选项 + 历史/默认方案
export async function getDecisionPageData(unitId = 'U-001') {
    const now = new Date();
    const deviceInfo = {
        unitName: `装置-${unitId}`,
        unitId,
        period: { type: '1_month', start: fmt(new Date(now.getTime() - 30 * 86400000)), end: fmt(now) },
        healthRate: rndInt(60, 95),       // 健康度（%）
        RUL: rndInt(15, 360),            // 剩余寿命（天）
        confidence: rndInt(70, 96),      // 置信度（%）
    };

    // 可选项
    const periodOptions = [
        { label: '近 1 月', value: '1_month' },
        { label: '近 3 月', value: '3_month' },
        { label: '自定义', value: 'custom' },
    ];
    // 当前装置相关的故障码（示例）
    const faultList = [
        { code: 'E01', name: '轴承磨损' },
        { code: 'W15', name: '对中偏差' },
        { code: 'E07', name: '润滑不足' },
        { code: 'E12', name: '转子不平衡' },
        { code: 'W22', name: '过载' },
    ];

    // 可选：默认策略（让页面初次进入就有可看内容）
    const defaultStrategies = makeStrategies({ healthRate: deviceInfo.healthRate, RUL: deviceInfo.RUL });

    return {
        deviceInfo,
        enums: { periodOptions, faultList },
        defaultStrategies,
    };
}

// 2) 决策接口模拟（POST /api/maintenance/decision）
export async function postMaintenanceDecision(payload) {
    // payload 结构：
    // { unitId, period, faultCodes[], healthRate, RUL, confidence, customRange? }

    // 根据输入“粗略生成”策略
    const { healthRate = 80, RUL = 120, confidence = 80, faultCodes = [] } = payload || {};
    const strategies = makeStrategies({ healthRate, RUL, confidence, faultCodes });
    // 模拟延时
    await new Promise(r => setTimeout(r, 300));
    return strategies;
}

// 3) 导出 & 工单（占位）
export async function exportWord(payload){ console.log('[mock] exportWord', payload); await wait(); return { ok: true, url: '#' }; }
export async function exportPdf(payload){ console.log('[mock] exportPdf', payload); await wait(); return { ok: true, url: '#' }; }
export async function createWorkOrder(payload){ console.log('[mock] createWorkOrder', payload); await wait(); return { ok: true, id: 'WO-' + rndInt(1000,9999) }; }

// —— 内部方法 —— //
function wait(ms=300){ return new Promise(r=>setTimeout(r, ms)); }

function makeStrategies({ healthRate=80, RUL=120, confidence=80, faultCodes=[] } = {}){
    // 简单打分：RUL 越低/健康度越低 → 建议越“重”
    const risk = (100 - healthRate) + Math.max(0, 180 - RUL) / 2 + (100 - confidence) / 3 + faultCodes.length * 5;
    const heavy = risk > 80;
    const mid   = risk > 50;

    const pool = [
        {
            strategy: '更换电机 + 人工巡检',
            manpowerCost: 12000,
            time: '6h',
            economy: 35000,
            parts: ['电机', '密封圈'],
            effect: '预计风险下降 85%',
            effectPct: 85
        },
        {
            strategy: '轴承更换 + 精对中 + 润滑优化',
            manpowerCost: 8000,
            time: '5h',
            economy: 22000,
            parts: ['轴承', '联轴器片', '润滑脂'],
            effect: '预计风险下降 78%',
            effectPct: 78
        },
        {
            strategy: '停机检修 + 复测 + 巡检加密',
            manpowerCost: 3500,
            time: '3h',
            economy: 8000,
            parts: ['标准耗材'],
            effect: '预计风险下降 55%',
            effectPct: 55
        },
        {
            strategy: '在线复测 + 观察两周（不换件）',
            manpowerCost: 1200,
            time: '1h',
            economy: 2500,
            parts: [],
            effect: '预计风险下降 28%',
            effectPct: 28
        },
    ];

    if (heavy)      return [pool[0], pool[1], pool[2]];
    if (mid)        return [pool[1], pool[2], pool[3]];
    return [pool[2], pool[3]];
}
