// /src/mock/deviceQualityMock.js
// 基于设备名/ID做种子，保证同一设备数据“稳定但可控随机”
function seededRandom(seed) {
    let t = seed % 2147483647;
    if (t <= 0) t += 2147483646;
    return () => (t = (t * 16807) % 2147483647) / 2147483647;
}

function hashStr(str = '') {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < String(str).length; i++) {
        h ^= String(str).charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

/**
 * 生成设备质量散点数据
 * @param {Object} opts
 * @param {string|number} opts.deviceKey  设备标识（设备名或ID）
 * @param {Date} opts.start               开始时间
 * @param {Date} opts.end                 结束时间
 * @param {number} opts.count             点数量
 * @returns {{points:Array, stats:Object}}
 */
export function genQualityPoints({ deviceKey, start, end, count = 600 }) {
    const seed = hashStr(deviceKey ?? 'unknown');
    const rnd = seededRandom(seed);

    // 为不同设备生成不同的分布中心与方差
    const cx = 50 + (rnd() - 0.5) * 20;  // x 中心 ~ [40,60]
    const cy = 50 + (rnd() - 0.5) * 20;  // y 中心 ~ [40,60]
    const sx = 10 + rnd() * 8;           // x 标准差 ~ [10,18]
    const sy = 10 + rnd() * 8;           // y 标准差 ~ [10,18]

    // 置信度分布（0~1）
    const cMean = 0.78 - rnd() * 0.2;    // 均值约 0.58~0.78
    const cStd  = 0.10 + rnd() * 0.08;   // 标准差约 0.10~0.18

    const t0 = start.getTime();
    const t1 = end.getTime();
    const dt = Math.max(1, Math.floor((t1 - t0) / count));

    const points = [];
    for (let i = 0; i < count; i++) {
        // Box–Muller 正态
        const n1 = Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
        const n2 = Math.sqrt(-2 * Math.log(1 - rnd())) * Math.sin(2 * Math.PI * rnd());
        const x = cx + n1 * sx;
        const y = cy + n2 * sy;

        // 置信度
        let conf = cMean + (rnd() - 0.5) * 2 * cStd;
        conf = Math.max(0, Math.min(1, conf));

        // 时间均匀铺开 + 少量抖动
        const ts = t0 + i * dt + Math.floor(rnd() * dt * 0.3);

        points.push({
            x, y, value: Number(conf.toFixed(3)), ts,
        });
    }

    return {
        points,
        stats: { cx, cy, sx, sy, cMean, cStd }
    };
}
