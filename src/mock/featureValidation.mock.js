// src/mock/featureValidation.mock.js

function toNumericSeries(series = []) {
    return (series || [])
        .map(d => (typeof d === 'number' ? d : (d?.feature_value ?? d?.value)))
        .filter(v => Number.isFinite(v))
}

function basicStats(arr = []) {
    const n = arr.length
    if (!n) return null
    const sorted = [...arr].sort((a,b)=>a-b)
    const mean = arr.reduce((a,b)=>a+b,0) / n
    const sd = Math.sqrt(arr.reduce((s,x)=>s+(x-mean)*(x-mean),0) / n) // population sd
    const qAt = (p)=> {
        const idx = (n-1)*p
        const lo = Math.floor(idx), hi = Math.ceil(idx)
        if (lo===hi) return sorted[lo]
        const t = idx-lo
        return sorted[lo]*(1-t) + sorted[hi]*t
    }
    const q1 = qAt(0.25), q3 = qAt(0.75)
    const iqr = q3 - q1
    return { n, mean, sd, q1, q3, iqr, min: sorted[0], max: sorted[n-1] }
}

/**
 * Feature Validation (Mock)
 * @param {Object} payload
 *  - featureName: string
 *  - value: number
 *  - series: number[] | {value|feature_value}[]
 *  - methods: [{type:'ZScore'|'IQR'|'Range', params:{...}}]
 * @returns {Promise<{feature, value, results: Array}>}
 */
export async function validateFeatureMock({ featureName, value, series = [], methods = [] }) {
    const xs = toNumericSeries(series)
    const st = basicStats(xs)

    const out = []
    for (const m of methods || []) {
        if (m.type === 'ZScore') {
            const thr = Number(m.params?.threshold ?? 3)
            const z = st && st.sd > 0 ? Math.abs((value - st.mean) / st.sd) : 0
            out.push({ method: 'ZScore', value: z, threshold: thr, passed: z <= thr })
        } else if (m.type === 'IQR') {
            const k = Number(m.params?.k ?? 1.5)
            const q1 = st?.q1 ?? value
            const q3 = st?.q3 ?? value
            const iqr = st?.iqr ?? 0
            const lower = q1 - k * iqr
            const upper = q3 + k * iqr
            const passed = value >= lower && value <= upper
            out.push({ method: 'IQR', lower, upper, k, passed })
        } else if (m.type === 'Range') {
            const min = Number(m.params?.min ?? -Infinity)
            const max = Number(m.params?.max ?? Infinity)
            const passed = value >= min && value <= max
            out.push({ method: 'Range', min, max, passed })
        }
    }

    return Promise.resolve({
        feature: featureName,
        value,
        stats: st,
        results: out
    })
}

/* 便于启动时直接出效果的样例 */
export const exampleFeature = 'rms'
export const exampleSeries = Array.from({length: 240}, (_,i)=> 0.5 + Math.sin(i/12)*0.05 + (Math.random()-0.5)*0.02)
export const exampleMethods = [
    { type: 'ZScore', params: { threshold: 3 } },
    { type: 'IQR', params: { k: 1.5 } },
    { type: 'Range', params: { min: 0.35, max: 0.75 } }
]
