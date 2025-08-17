// 简单 mock，字段与设备页绑定一致
function rnd(n=1){ return Math.random()*n }
function randint(min,max){ return Math.floor(Math.random()*(max-min+1))+min }
function pad(n){ return String(n).padStart(2,'0') }
function fmt(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }

export async function getDevicePageData(deviceId=101, { days=30 } = {}){
    const now = new Date()
    const device = {
        device_name: `设备-${deviceId}`,
        component_code: `D-${deviceId}`,
        component_type: ['泵','电机','风机','阀门'][randint(0,3)],
        component_model: ['M-100','M-200','X-10','X-20'][randint(0,3)],
        manufacturer: ['华东重工','北方机电','中能装备'][randint(0,2)],
        install_date: `202${randint(0,4)}-${pad(randint(1,12))}-${pad(randint(1,28))}`,
        status: ['OK','Warning','Fault'][randint(0,2)],
        health_level: randint(40,100),
        remaining_life: randint(10,480),
        confidence_level: randint(60,98)
    }
    const parents = { system_name:`装置-${randint(1,20)}`, site_name:`基地-${randint(1,5)}` }
    const highProbThreshold = 70

    // 最新诊断快照
    const snapshot = {
        id: randint(1000,9999),
        fault_name: ['轴承磨损','对中偏差','润滑不足','转子不平衡'][randint(0,3)],
        probability: randint(35,96),
        diagnosis_time: fmt(new Date(now.getTime()-randint(0,days)*86400000)),
        diagnosis_basis_short: '振动RMS上升，Kurtosis 异常；温升伴随',
        diagnosis_basis: '1) 频域峰值在 1X 附近增强；\n2) 时域RMS较基线+35%；\n3) 包络解调显示滚动体通过频率；\n4) 温度通道均值上升 6℃。',
        raw_file_id: `RAW-${randint(10000,99999)}`
    }

    // 诊断记录列表（倒序）
    const N = randint(10,28)
    const records = Array.from({length:N}).map((_,i)=>{
        const d = new Date(now.getTime()-i*86400000)
        const prob = randint(30,95)
        return {
            id: 10000+i,
            diagnosis_time: fmt(d),
            fault_name: ['轴承磨损','对中偏差','润滑不足','转子不平衡','过载'][randint(0,4)],
            probability: prob,
            description: prob>85 ? '建议尽快检修' : (prob>70 ? '建议重点观察' : '—'),
            diagnosis_basis: `自动生成依据片段 #${i}`,
            raw_file_id: `RAW-${randint(10000,99999)}`,
            confirmed: Math.random()>0.8
        }
    })

    // 规则提示（示例）
    const highCount = records.slice(0,5).filter(r=>r.probability>=highProbThreshold).length
    const riskTips = []
    if (highCount>=3) riskTips.push(`最近 <b>${highCount}</b> 次诊断高概率，<b>建议升级为故障</b>。`)
    if (device.remaining_life < 60 && device.health_level < 70) riskTips.push('RUL < 60 且健康度较低，建议进入观察与复测。')

    // 概率趋势
    const pts = Array.from({length: (days===7?7:30)}).map((_,i)=>{
        const d = new Date(now.getTime()-(days-1-i)*86400000)
        return { date: `${pad(d.getMonth()+1)}-${pad(d.getDate())}`, prob: randint(20,96) }
    })

    // 特征 QA（演示：20% 情况下失败且拦截）
    const qa = Math.random()<0.2 ? { passed:false, block:true, msg:'关键特征缺失/时钟漂移' } : { passed:true, block:false, msg:'' }

    return {
        meta: { highProbThreshold },
        device,
        parents,
        snapshot,
        records,
        riskTips,
        charts: { probTrend: { dates: pts.map(p=>p.date), probs: pts.map(p=>p.prob) } },
        qa
    }
}
