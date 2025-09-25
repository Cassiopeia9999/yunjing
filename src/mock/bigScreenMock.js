// bigScreenMock.js
// 说明：地图、Top 省份仍走后端；KPI 的“装置/设备数量”改为真实统计。
// 其余指标暂用占位，等你有接口再替换。

import {
    getBaseList,
    getAssessmentUnits,
    fetchDevices,
    // fetchDiagnoses // 如需“近7天诊断数量”等再打开
} from '@/mock/fetchDataApi.js';

/** 工具：安全数值转换 */
const toNumber = (v) => (v == null || v === '' ? 0 : Number(v));

/** 工具：从地址里抽取“省级”名称（匹配 省/市/自治区/特别行政区） */
function extractProvince(address = '') {
    const m = address.match(/(.+?(省|市|自治区|特别行政区))/);
    if (m && m[1]) return m[1].replace(/(省|市|自治区|特别行政区)$/, '');
    if (address.length >= 2) return address.slice(0, 2);
    return '未知';
}

/** 地图数据（基地点位 + 省份聚合 + 中控中心）—— 来自后端 */
export async function getMapData() {
    const list = await getBaseList(); // 基地管理表
    const bases = (list || [])
        .filter(b => b.longitude != null && b.latitude != null)
        .map(b => ({
            name: b.name,
            coord: [Number(b.longitude), Number(b.latitude)],
            value: toNumber(b.eva_value) || 0,
            address: b.address || ''
        }));

    const hub = (list || []).find(
        b => String(b.is_center_hub).toUpperCase() === 'TRUE'
            || String(b.is_center_hub) === 'true'
            || b.is_center_hub === true
    );
    const centerHub = hub && hub.longitude != null && hub.latitude != null
        ? { name: hub.name || '中控中心', coord: [Number(hub.longitude), Number(hub.latitude)] }
        : { name: '中控中心', coord: [112.938814, 28.228209] };

    const provMap = new Map();
    for (const b of (list || [])) {
        const prov = extractProvince(b.address || '');
        const val = toNumber(b.eva_value) || 1;
        provMap.set(prov, (provMap.get(prov) || 0) + val);
    }
    const provStat = Array.from(provMap, ([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12);

    return { centerHub, bases, provStat };
}

/** 省份 Top 列表 —— 基于 getMapData 的 provStat */
export async function getTopProvinces() {
    const { provStat } = await getMapData();
    return provStat;
}

/** 🔧 统计：按“基地-装置-设备”层级，汇总真实数量 */
async function getUnitDeviceCounts() {
    const bases = await getBaseList();
    if (!bases || bases.length === 0) return { totalUnits: 0, totalDevices: 0 };

    // 并发按基地统计，避免串行放大延迟
    const perBaseStats = await Promise.all(
        bases.map(async (b) => {
            // 1) 装置
            const units = await getAssessmentUnits(b.id); // 注意：你的 getAssessmentUnits(baseId=1) 默认给了 1，这里显式传 b.id
            const unitIds = (units || []).map(u => u.id);

            // 2) 设备（依赖 baseId + unitIds）
            const devices = unitIds.length > 0
                ? await fetchDevices(b.id, unitIds)
                : [];

            return { units: units.length, devices: devices.length };
        })
    );

    // 汇总
    let totalUnits = 0;
    let totalDevices = 0;
    for (const s of perBaseStats) {
        totalUnits += s.units;
        totalDevices += s.devices;
    }
    return { totalUnits, totalDevices };
}
// === 新增：稳定伪随机（按“当天 + 版本号”固定），避免每次刷新都变 ===
function makeDaySeed(suffix = 1) {
    const d = new Date();
    const key = `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}_${suffix}`;
    let h = 2166136261 ^ key.length; // FNV-like
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) || 1;
}
function rng(seed) {
    let x = seed >>> 0;
    return () => {
        // xorshift32
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        return (x >>> 0) / 0xffffffff;
    };
}
function randInt(r, min, max) { return Math.floor(r() * (max - min + 1)) + min; }
function randFloat(r, min, max, fix = 1) { return +((r() * (max - min) + min).toFixed(fix)); }

// === 修改：KPI 里仅补充“近7天诊断 / 高概率 / 平均MTTR”的模拟值 ===
export async function getKpis() {
    const bases = await getBaseList();
    const baseCount = (bases || []).length;

    const { totalUnits, totalDevices } = await getUnitDeviceCounts();

    // 仅为缺数据的项给模拟值（每天固定）
    const r = rng(makeDaySeed(7));
    const alarms7d = randInt(r, 48, 160);          // 近7天诊断条数
    const hpRate   = randInt(r, 18, 42);           // 高概率（%）
    const mttrH    = randFloat(r, 6.0, 18.0, 1);   // 平均修复时长（小时）

    return [
        { key: 'bases',   label: '接入基地', value: baseCount,   unit: '' },
        { key: 'units',   label: '装置数量', value: totalUnits,   unit: '' },     // ✅真实
        { key: 'devices', label: '在线设备', value: totalDevices, unit: '' },     // ✅真实（若需在线/离线分离再说）
        { key: 'alarms',  label: '近7天诊断', value: alarms7d,     unit: '' },     // 🧪模拟
        { key: 'hp',      label: '高概率',    value: hpRate,       unit: '%' },    // 🧪模拟（百分比）
        { key: 'mttr',    label: '平均MTTR',  value: mttrH,        unit: 'h' },   // 🧪模拟（小时）
    ];
}

// === 替换：近14天告警趋势（平滑波动 + 噪声，每天固定） ===
export function getAlarmTrend() {
    const r = rng(makeDaySeed(14));
    const days = 14;
    const x = Array.from({ length: days }, (_, i) => `D${i + 1}`);
    const base = randInt(r, 120, 220);
    const y = Array.from({ length: days }, (_, i) => {
        const wave = Math.sin((i / days) * Math.PI * 1.6) * randInt(r, 40, 80);
        const noise = randInt(r, -12, 12);
        return Math.max(20, Math.round(base + wave + noise));
    });
    return { x, y };
}

// === 可选替换：健康占比（正常/关注/故障，总和=100，每天固定） ===
export function getHealthPie() {
    const r = rng(makeDaySeed(3));
    const normal = randInt(r, 58, 76);
    const fault  = randInt(r, 8, 15);
    const watch  = Math.max(0, 100 - normal - fault);
    return [
        { name: '正常', value: normal },
        { name: '关注', value: watch  },
        { name: '故障', value: fault  },
    ];
}

// === 可选替换：告警快讯（生成更像真的条目） ===
export function getAlarmFeed() {
    const r = rng(makeDaySeed(5));
    const now = new Date();
    const pad = (n)=> String(n).padStart(2, '0');
    const mkTime = (minsAgo) => {
        const t = new Date(now.getTime() - minsAgo * 60000);
        return `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
    };
    const lv = ['高','中','低'];
    const titles = [
        '设备#ZX-114 轴承振动偏高','设备#H-09 温度突升','装置#A32 高频异常',
        '装置#B08 通道噪点增多','设备#S-21 电流越限','设备#K-07 冷却水压不稳',
        '设备#D-03 油温上升','装置#C12 信噪比下降'
    ];
    const n = randInt(r, 5, 8);
    const rows = [];
    for (let i = 0; i < n; i++) {
        rows.push({
            time: mkTime(randInt(r, 2, 60)),
            title: titles[randInt(r, 0, titles.length - 1)],
            level: lv[randInt(r, 0, lv.length - 1)]
        });
    }
    // 新的在上
    return rows.sort((a,b)=> a.time < b.time ? 1 : -1);
}
