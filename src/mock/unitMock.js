// src/mock/dataService.js
// 如果你已经有本文件并包含 getBasePageData，直接把下面的 getUnitPageData 与辅助函数合并进去即可。
// 若是新建文件，也可在此补充/导出 getBasePageData 的 mock。

/** 简单可复现随机数（按 seed） */
function createRng(seed = 1) {
    let s = seed % 2147483647
    if (s <= 0) s += 2147483646
    return () => (s = (s * 16807) % 2147483647) / 2147483647
}
function pick(rng, arr) { return arr[Math.floor(rng()*arr.length)] }
function randint(rng, min, max) { return Math.floor(rng()*(max-min+1))+min }
function randfloat(rng, min, max, fixed = 0) {
    const v = rng()*(max-min)+min
    return fixed>=0 ? +v.toFixed(fixed) : v
}
function dateAddDays(date, d){
    const t = new Date(date)
    t.setDate(t.getDate()+d)
    return t
}
function fmtDate(d){
    const pad = n => String(n).padStart(2,'0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 枚举（与前端筛选控件联动） */
const ENUMS = {
    status: ['OK','Warning','Fault'],
    types: ['泵','阀门','电机','风机','轴承座','传感器'],
    models: ['M-100','M-200','M-300','X-10','X-20','X-30'],
    alarmLevels: ['Critical','Major','Minor','Info']
}

/** 知识库名称样例（故障知识点） */
const KNOWLEDGE = ['轴承磨损','对中偏差','润滑不足','转子不平衡','气蚀','过载','松动','电气故障','对地短路']

/**
 * Mock：按装置生成页面数据
 * @param {number|string} unitId
 * @param {{days:number, highProbThreshold:number}} opts
 * @returns {Promise<object>}
 */
export async function getUnitPageData(unitId = 1, opts = { days: 7, highProbThreshold: 70 }) {
    // 以 unitId + days 作为随机种子，保证每个装置页面数据相对稳定
    const seed = Number(String(unitId).replace(/\D/g,'')) + (opts?.days || 7) * 97
    const rng = createRng(seed || 1)

    // 装置基本信息
    const system_name = `装置-${unitId}`
    const system_type = pick(rng, ['压缩机组','循环水系统','锅炉','输送线','冷却塔'])
    const system_code = `U-${String(unitId).padStart(3,'0')}`
    const system_model = pick(rng, ENUMS.models)
    const manufacturer = pick(rng, ['华东重工','北方机电','中能装备','东华动力'])
    const install_date = `20${randint(rng,18,24)}-${String(randint(rng,1,12)).padStart(2,'0')}-${String(randint(rng,1,28)).padStart(2,'0')}`
    const system_status = pick(rng, ENUMS.status)
    const now = new Date()
    const time = fmtDate(now)

    // 装置级 RUL / Conf
    const unitRUL = randint(rng, 20, 360)         // 天
    const unitConf = randint(rng, 60, 98)         // %
    const highProbThreshold = opts?.highProbThreshold ?? 70

    // 设备数量
    const deviceCount = randint(rng, 18, 48)
    const devices = []
    for (let i=0;i<deviceCount;i++){
        const id = Number(`${unitId}${i+1}`)
        const device_name = `设备-${unitId}-${i+1}`
        const component_type = pick(rng, ENUMS.types)
        const component_model = pick(rng, ENUMS.models)
        const component_code = `D-${unitId}-${String(i+1).padStart(3,'0')}`
        const status = pick(rng, ENUMS.status)
        const health_level = randint(rng, 40, 100)
        const remaining_life = randint(rng, 10, 480)
        const confidence_level = randint(rng, 50, 99)
        const man = pick(rng, ['中科智造','华通机电','海纳设备','江能动力'])

        // 最近诊断
        const hasDiag = rng() > 0.18
        const diag = hasDiag ? {
            id: Number(`${unitId}${i+1}9`),
            diagnosis_time: fmtDate(dateAddDays(now, -randint(rng,0,opts.days||7))),
            fault_knowledge_id: randint(rng, 100, 900),
            fault_knowledge_name: pick(rng, KNOWLEDGE),
            probability: randfloat(rng, 30, 98, 0)
        } : null

        // 最新告警
        const hasAlarm = rng() > 0.65
        const severity = hasAlarm ? pick(rng, ENUMS.alarmLevels) : null
        const severityLevel = severity ? (severity==='Critical'?4:severity==='Major'?3:severity==='Minor'?2:1) : 0
        const alarm = hasAlarm ? {
            id: Number(`${unitId}${i+1}8`),
            type: pick(rng, ['振动超限','温度过高','电流异常','润滑压力低','流量异常']),
            severity,
            severityLevel,
            time: fmtDate(dateAddDays(now, -randint(rng,0,opts.days||7))),
            desc: pick(rng, ['短时峰值','持续超限','间歇告警','阈值附近抖动'])
        } : null

        devices.push({
            id, device_name, component_code, component_type, component_model,
            manufacturer: man, install_date: install_date,
            status, health_level, remaining_life, confidence_level,
            diag, alarm
        })
    }

    // 聚合均值
    const avgRUL = Math.round(devices.reduce((s,d)=>s+(d.remaining_life||0),0)/devices.length || 0)
    const avgConf = Math.round(devices.reduce((s,d)=>s+(d.confidence_level||0),0)/devices.length || 0)

    // KPI（近 days 天）
    const diagList = devices.map(d=>d.diag).filter(Boolean)
    const diagCount = diagList.length
    const highCount = diagList.filter(d=> d.probability >= highProbThreshold).length
    const alarmOpen = devices.filter(d=> d.alarm).length

    // 图表：诊断分布（按知识库）
    const diagDistMap = {}
    for (const d of diagList) {
        const key = d.fault_knowledge_name
        if(!diagDistMap[key]) diagDistMap[key] = { value: 0, highs: 0 }
        diagDistMap[key].value += 1
        if (d.probability >= highProbThreshold) diagDistMap[key].highs += 1
    }
    const diagDist = Object.entries(diagDistMap).map(([name, v])=>({
        name, value: v.value, highShare: v.value ? Math.round(100*v.highs/v.value) : 0
    })).sort((a,b)=>b.value-a.value).slice(0,8)

    // 图表：告警等级占比
    const alarmDistMap = { Critical:0, Major:0, Minor:0, Info:0 }
    for (const d of devices) if (d.alarm) alarmDistMap[d.alarm.severity] += 1
    const alarmDist = Object.entries(alarmDistMap).map(([level,count])=>({ level, count }))
        .filter(x=>x.count>0)

    // 图表：诊断趋势（最近 days 天）
    const trendDays = opts?.days === 30 ? 30 : 7
    const dates = []
    const counts = []
    for (let i=trendDays-1; i>=0; i--){
        const d = dateAddDays(now, -i)
        const label = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        dates.push(label)
        // 简单用随机 + 设备数量比例模拟
        counts.push(randint(rng, Math.round(deviceCount*0.02), Math.round(deviceCount*0.12)))
    }

    // 在制故障（示例）
    const faults = []
    const faultN = randint(rng, 0, 4)
    for (let i=0;i<faultN;i++){
        const code = `F-${unitId}-${String(i+1).padStart(2,'0')}`
        faults.push({
            code,
            status: pick(rng, ['待分派','处理中','待确认']),
            owner: pick(rng, ['张工','李工','王工','赵工']),
            sla_deadline: fmtDate(dateAddDays(now, randint(rng,1,10))),
            summary: pick(rng, ['轴承温升异常，建议停机检查','振动幅值异常，建议复测','润滑油颗粒度偏高，建议更换'])
        })
    }

    // 告警中心（示例）
    const alarmCenter = devices
        .filter(d=>d.alarm)
        .slice(0, 12)
        .map(d=>({
            id: d.alarm.id,
            device_name: d.device_name,
            type: d.alarm.type,
            severity: d.alarm.severity,
            time: d.alarm.time,
            desc: d.alarm.desc
        }))

    // 返回结构（与页面期望一致）
    return Promise.resolve({
        meta: { highProbThreshold },
        unit: {
            system_name, system_type, system_code, system_model, manufacturer,
            install_date, system_status, time: time,
            remaining_life: unitRUL, confidence_level: unitConf
        },
        aggregates: { avgHealth: null, avgRUL, avgConf }, // avgHealth 可按需提供
        kpis: { diagCount, highCount, alarmOpen },
        devices,
        charts: {
            diagDist,
            alarmDist,
            diagTrend: { dates, counts }
        },
        faults,
        alarmCenter,
        enums: ENUMS
    })
}

// 如需导出其它 mock，可在此一并导出
// export async function getBasePageData(...) { ... }
