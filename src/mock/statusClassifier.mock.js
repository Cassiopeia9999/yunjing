// src/mock/statusClassifier.mock.js

/**
 * 对单点做状态分类（Mock）
 * 入参：
 *  - features: [{name, value}]
 *  - xKey, yKey: 选为坐标轴的特征名
 * 返回：
 *  { time, x, y, result: 'Normal'|'Warning'|'Fault', scores: {Normal, Warning, Fault}, xKey, yKey }
 */
export async function classifyStatusMock({ features = [], xKey, yKey }) {
    const map = new Map(features.map(i => [i.name, i.value]))
    const x = Number(map.get(xKey))
    const y = Number(map.get(yKey))

    // —— Mock 归一化：把任意量纲压到 0..1 —— //
    const norm = (v) => {
        if (v == null || Number.isNaN(v)) return 0
        const s = Math.atan(Math.abs(v)) * (2 / Math.PI) // 0..1 的连续映射
        return s
    }
    const nx = norm(x)
    const ny = norm(y)
    const r = Math.sqrt(nx * nx + ny * ny) // 0..~1.41

    // —— 简单阈值：半径越大越危险 —— //
    let result = 'Normal'
    if (r >= 1.1) result = 'Fault'
    else if (r >= 0.6) result = 'Warning'

    // —— 构造一个平滑的 mock 概率 —— //
    const clamp = (t) => Math.max(0, Math.min(1, t))
    const pFault = clamp((r - 0.6) / (1.1 - 0.6))          // 0→1 in [0.6,1.1]
    const pWarnBase = clamp((r - 0.2) / (0.6 - 0.2))       // 0→1 in [0.2,0.6]
    const pWarn = clamp(pWarnBase * (1 - pFault))
    const pNorm = clamp(1 - pWarn - pFault)

    return Promise.resolve({
        time: new Date().toISOString(),
        x, y,
        xKey, yKey,
        result,
        scores: { Normal: pNorm, Warning: pWarn, Fault: pFault }
    })
}

/* 便于本地试跑的样例数据（可选） */
export const exampleFeatures = [
    { name: 'rms', value: 0.42 },
    { name: 'impulse_index', value: 0.18 },
    { name: 'cwt_energy', value: 0.61 },
    { name: 'kurtosis', value: 1.2 }
]
