// 简单种子随机，保证同条件下稳定复现

// pointRowData.js (节选/新增)

import { getSysConfigFormId, DEVICE_FORM_ID } from '@/api/constant/form_constant.js'
import {fetchTableData} from "@/api/querydata.js";

function makeRand(seed = 1){
    let s = seed >>> 0
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff)
}
function pick(arr, rnd){ return arr[Math.floor(rnd()*arr.length)] }

// ====== 共享注册表：记录每个测点的采样率/长度/单位 ======
const POINT_META = new Map(); // key = pointId, value = { sample_rate, length, unit }

// 生成周期（最近 7/30/90 天）
export async function mockListPeriods(){
    const now = Date.now()
    const mk = (days) => ({
        period_name: `近 ${days} 天`,
        start_time: new Date(now - days*24*3600*1000).toISOString(),
        end_time:   new Date(now).toISOString()
    })
    return [mk(7), mk(30), mk(90)]
}



/**
 * 拉取指定设备、时间范围内的文件记录（online_table_42: 设备实时数据）
 * 返回结构中会包含 channels 数组，来源于 channel_names 字段(JSON字符串)
 *
 * @param {Object} params
 * @param {Date}   params.start
 * @param {Date}   params.end
 * @param {String|null} params.deviceId
 */
export async function fetchRawFiles({ start, end, deviceId }) {
    const filters = []

    if (deviceId) {
        filters.push({
            key: 'device_id',
            value: deviceId,
            queryType: '='
        })
    }

    if (start instanceof Date) {
        filters.push({
            key: 'collect_time',
            value: start.toISOString(),
            queryType: '>='
        })
    }
    if (end instanceof Date) {
        filters.push({
            key: 'collect_time',
            value: end.toISOString(),
            queryType: '<='
        })
    }

    // online_table_42 / "设备实时数据"
    // 你说它在系统里对应 Real_Time_Device_Data；我们就用这个 key
    const formId = getSysConfigFormId('Real_Time_Device_Data')

    const res = await fetchTableData(
        1,      // pageNo
        1000,   // pageSize
        formId,
        filters
    )

    const list = res?.data?.list || []

    // 统一结构给前端用
    return list.map(row => {
        // channel_names 是后端的 text 字段，JSON 字符串，比如 '["EVAE","EVA","EVC"]'
        let channels = []
        if (row.channel_names) {
            try {
                const parsed = JSON.parse(row.channel_names)
                if (Array.isArray(parsed)) {
                    channels = parsed
                }
            } catch (e) {
                console.warn('channel_names 不是合法JSON:', row.channel_names, e)
            }
        }

        return {
            id: row.id,
            device_id: row.device_id,
            file_name: row.file_name,
            file_path: row.file_path,
            file_size: row.file_size,
            collect_time: row.collect_time,
            parse_status: row.parse_status,
            feature_count: row.feature_count,
            work_situation: row.work_situation,
            file_quality: row.file_quality,
            feature_quality: row.feature_quality,
            // 通道相关
            channel_count: row.channel_count,
            channel_names_raw: row.channel_names, // 原始字符串
            channels // 解析后的数组，前端直接拿这个渲染列表
        }
    })
}



// 某个原始文件内的测点（5 分钟采 1 点）
export async function mockFetchPointsInRaw(rawId){
    const rnd = makeRand([...rawId].reduce((s,c)=>s+c.charCodeAt(0),0))
    const names = ['X轴加速度','Y轴加速度','Z轴加速度','轴承外圈','轴承内圈','驱动端','非驱动端','温度1','温度2','电流A']
    const count = 4 + Math.floor(rnd()*6) // 4~9
    const arr = []
    for (let i=0;i<count;i++){
        const name = pick(names, rnd)
        const len = Math.floor(200 + rnd()*1200) // 200~1400 个点（约 16.7 小时 ~ 4.8 天）
        const meta = {
            sample_rate: 1/300,                         // ✅ 5 分钟 1 点（0.003333... Hz）
            length: len,
            unit: /温度/.test(name) ? '℃' : 'g'
        }
        const pointId = `${rawId}_${i}`

        // 记录元信息，供后续取波形时使用
        POINT_META.set(pointId, meta)

        arr.push({
            id: pointId,
            point_name: `${name}-${i+1}`,
            sample_rate: meta.sample_rate,
            unit: meta.unit,
            length: meta.length
        })
    }
    return arr
}

// ---- 可调参数 ----
const CFG = {
    driftPct:   [0.02, 0.05],   // 低频漂移幅度 = mu * 2%~5%
    wavePct:    [0.04, 0.10],   // 周期扰动幅度 = mu * 4%~10%
    noisePct:   [0.015, 0.035], // 高斯噪声 = mu * 1.5%~3.5%
    outlierRate:[0.00005, 0.00020], // 异常点比例 0.005%~0.02%
    nullShare:  0.10
}

// 某个测点的波形（一维数组）——与测点元信息严格一致
export async function mockFetchPointSeries(rawId, pointId){
    const seed = [...(rawId + '|' + pointId)].reduce((s,c)=>s + c.charCodeAt(0), 0)
    const rnd  = makeRand(seed)

    // ✅ 关键：沿用 mockFetchPointsInRaw 里记录的采样率/长度/单位
    const meta = POINT_META.get(pointId) || { sample_rate: 1/300, length: 300, unit: 'g' }
    const sample_rate = meta.sample_rate
    const length      = meta.length
    const unit        = meta.unit

    // 基线（均值）：围绕它波动
    const mu = 0.4 + rnd() * 2.1  // 0.4~2.5

    // 波动组件
    const twoPi    = Math.PI * 2
    const driftAmp = mu * (CFG.driftPct[0] + rnd() * (CFG.driftPct[1] - CFG.driftPct[0]))
    const driftFreq= 0.02 + rnd() * 0.08
    const waveAmp  = mu * (CFG.wavePct[0]  + rnd() * (CFG.wavePct[1]  - CFG.wavePct[0]))
    const waveFreq = 5 + rnd() * 60
    const sigma    = mu * (CFG.noisePct[0] + rnd() * (CFG.noisePct[1] - CFG.noisePct[0]))

    // 高斯噪声
    const gauss = () => {
        let u = 0, v = 0
        while (u === 0) u = rnd()
        while (v === 0) v = rnd()
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    }

    // 生成波形（t 单位：秒；5 分钟 1 点 => t 以 300s 递增）
    const values = new Array(length)
    for (let i = 0; i < length; i++) {
        const t = i / sample_rate
        const v = mu
            + driftAmp * Math.sin(twoPi * driftFreq * t)
            + waveAmp  * Math.sin(twoPi * waveFreq  * t)
            + sigma    * gauss()
        values[i] = Number(Math.max(0, v).toFixed(6)) // 防负值
    }

    // 少量异常
    const rate = CFG.outlierRate[0] + rnd() * (CFG.outlierRate[1] - CFG.outlierRate[0])
    const outlierCnt = Math.max(1, Math.floor(length * rate))
    for (let k = 0; k < outlierCnt; k++) {
        const idx = Math.floor(rnd() * length)
        const r   = rnd()
        if (r < (1 - CFG.nullShare) / 2) {
            const spike = mu * (0.3 + rnd() * 0.9)
            values[idx] = Number((values[idx] + spike).toFixed(6))
        } else if (r < (1 - CFG.nullShare)) {
            const drop = mu * (0.25 + rnd() * 0.6)
            values[idx] = Number(Math.max(0, values[idx] - drop).toFixed(6))
        } else {
            values[idx] = null
        }
    }

    return { sample_rate, unit, values }
}



/**
 * 获取设备下拉用的全部设备列表（分页获取）
 * 实际从后端接口 /api/onlinecode/queryListPage 获取
 *
 * 返回数组：每条记录至少包含
 *   - id
 *   - component_code (设备名称)
 *   - component_model (型号规格)
 *   - status (运行状态)
 *   - ... 其他字段保持原样
 */
export async function fetchDevices () {
    const formId = getSysConfigFormId(DEVICE_FORM_ID)

    // 设备列表是标准的“分页数据列表”
    // 我们这里直接拉第1页，size=1000，足够下拉使用
    const res = await fetchTableData(
        1,            // pageNo
        1000,         // pageSize
        formId,       // formId => online_table_24
        []            // filters，无筛选条件，拿全部
    )

    // 正常情况下 res.data.list 已经 strip 掉系统字段
    const list = res?.data?.list || []

    // 返回前可以确保每个元素至少有 id，以防 UI 报错
    return list.map(row => ({
        id: row.id,
        ...row
    }))
}

