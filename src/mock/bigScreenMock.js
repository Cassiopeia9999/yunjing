// bigScreenMock.js
// 说明：导出名称保持不变；其中 getMapData / getTopProvinces / getKpis 基于后端；
// 其他函数（趋势、播报、健康占比）先保留占位实现，后续你可接入真实接口。

import { getBaseList } from '@/mock/fetchDataApi.js'

/** 工具：安全数值转换 */
const toNumber = (v) => (v == null || v === '' ? 0 : Number(v))

/** 工具：从地址里抽取“省级”名称（匹配 省/市/自治区/特别行政区） */
function extractProvince(address = '') {
    const m = address.match(/(.+?(省|市|自治区|特别行政区))/)
    if (m && m[1]) {
        return m[1].replace(/(省|市|自治区|特别行政区)$/, '')
    }
    // 没有标准省级关键词时，取前两个字作为粗略省份分组，或归入“未知”
    if (address.length >= 2) return address.slice(0, 2)
    return '未知'
}

/** 地图数据（基地点位 + 省份聚合 + 中控中心）—— 来自后端 */
export async function getMapData() {
    const list = await getBaseList() // 后端返回的“基地管理”表
    // 基地点位（需要经纬度）
    const bases = (list || [])
        .filter(b => b.longitude != null && b.latitude != null)
        .map(b => ({
            name: b.name,
            coord: [Number(b.longitude), Number(b.latitude)],
            value: toNumber(b.eva_value) || 0, // 作为热度/健康权重
            address: b.address || ''
        }))

    // 中控中心（is_center_hub === 'Y' / '1' / true 均认为是）
    const hub = (list || []).find(
        b => String(b.is_center_hub).toUpperCase() === 'TRUE' || String(b.is_center_hub) === 'true' || b.is_center_hub === true
    )
    const centerHub = hub && hub.longitude != null && hub.latitude != null
        ? { name: hub.name || '中控中心', coord: [Number(hub.longitude), Number(hub.latitude)] }
        : { name: '中控中心', coord: [112.938814, 28.228209] } // 兜底：长沙

    // 省份聚合（按地址分组，聚合 eva_value（缺省为 1））
    const provMap = new Map()
    for (const b of (list || [])) {
        const prov = extractProvince(b.address || '')
        const val = toNumber(b.eva_value) || 1
        provMap.set(prov, (provMap.get(prov) || 0) + val)
    }
    const provStat = Array.from(provMap, ([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12)

    return { centerHub, bases, provStat }
}

/** 省份 Top 列表 —— 基于 getMapData 的 provStat */
export async function getTopProvinces() {
    const { provStat } = await getMapData()
    return provStat
}

/** KPI —— 至少把“基地数”用后端数据，其他指标占位（你有接口后再替换） */
export async function getKpis() {
    const bases = await getBaseList()
    const baseCount = (bases || []).length
    return [
        { key: 'bases',  label: '接入基地', value: baseCount, unit: '' },
        { key: 'units',  label: '装置数量', value: null,      unit: '' },  // TODO: 接口后替换
        { key: 'devices',label: '在线设备', value: null,      unit: '' },  // TODO
        { key: 'alarms', label: '近7天诊断',value: null,      unit: '' },  // TODO
        { key: 'hp',     label: '高概率',   value: null,      unit: '' },  // TODO
        { key: 'mttr',   label: '平均MTTR', value: null,      unit: 'h' }, // TODO
    ]
}

/** 趋势/播报/健康占比 —— 先保留占位： */
export function getAlarmTrend() {
    return {
        x: Array.from({ length: 14 }, (_, i) => `D${i + 1}`),
        y: [120, 132, 160, 148, 210, 195, 180, 220, 260, 230, 205, 198, 215, 240]
    }
}

export function getAlarmFeed() {
    return [
        { time: '13:02:11', title: '装置#A32 高频异常',     level: '高' },
        { time: '12:55:03', title: '设备#ZX-114 轴承震动偏高', level: '中' },
        { time: '12:41:27', title: '设备#H-09 温度突升',     level: '高' },
        { time: '12:36:12', title: '装置#B08 通道噪点增多',   level: '低' },
        { time: '12:20:06', title: '设备#S-21 电流越限',     level: '中' },
    ]
}

export function getHealthPie() {
    return [
        { name: '正常', value: 66 },
        { name: '关注', value: 22 },
        { name: '故障', value: 12 },
    ]
}
