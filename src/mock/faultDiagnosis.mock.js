// 特征可选项
export const fdFeatureOptions = [
    'rms', 'kurtosis', 'crest_factor', 'peak', 'impulse_index', 'cwt_energy'
]

// 最近通道数据（1k 点）
export function getRecentChannelDataMock () {
    const now = Date.now()
    const dt = 200  // 200ms 间隔
    const n = 1000
    const data = new Array(n).fill(0).map((_, i) => ({
        t: now - (n - i) * dt,
        value: Math.sin(i / 15) + 0.2 * Math.random()
    }))
    return data
}

// 基于 features + data 产出散点诊断结果
export function runFaultDiagnosisMock ({
                                           data, xFeature, yFeature
                                       }) {
    // 简化：从原始 value 生成“特征值”
    const res = []
    for (let i = 0; i < data.length; i += 5) {          // 降采样
        const d = data[i]
        const x = featureMap(xFeature, d.value, i)
        const y = featureMap(yFeature, d.value, i + 7)
        const score = Math.abs(x) + Math.abs(y)
        const result = score > 2.2 ? 'Fault' : score > 1.4 ? 'Warning' : 'Normal'
        const confidence = Math.min(0.5 + score / 3, 0.99)
        res.push({ time: d.t, x, y, result, confidence })
    }
    return { points: res }
}

// 伪特征映射
function featureMap (name, v, idx) {
    switch (name) {
        case 'rms':            return Math.sqrt(Math.abs(v)) * 1.2
        case 'kurtosis':       return (v ** 4) / 4 + 0.05 * Math.sin(idx / 10)
        case 'crest_factor':   return Math.abs(v) * (1.5 + 0.2 * Math.sin(idx / 8))
        case 'peak':           return Math.max(v, 0) * 2
        case 'impulse_index':  return (Math.abs(v) > 0.8 ? 1.2 : 0.4) + 0.2 * Math.random()
        case 'cwt_energy':     return Math.abs(v) * 0.8 + 0.3 * Math.cos(idx / 6)
        default:               return v
    }
}
