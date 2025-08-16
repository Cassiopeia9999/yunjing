// 统一导出，后续切换成后端接口时保持方法名不变即可
// 例如把 Promise.resolve(...) 改成 axios.get(...)

export function getBoardSnapshot() {
    return Promise.resolve({
        time: new Date().toISOString(),
        kpis: [
            { key: 'thrustVib',   name: '推进振动', value: 350, unit: '起', delta: +12 },
            { key: 'boomVib',     name: '吊臂振动', value: 151, unit: '起', delta: -3  },
            { key: 'sealLeak',    name: '密封渗漏', value: 423, unit: '起', delta: +7  },
            { key: 'loose',       name: '松脱错位', value: 421, unit: '起', delta: +2  },
            { key: 'hi_avg',      name: '平均健康度', value: 0.78, unit: '',  delta: +0.01 },
            { key: 'rul_avg',     name: '平均RUL(天)', value: 132, unit: '天', delta: +5 },
        ],
        // 基地点位（用于地图）
        bases: [
            { id: 1, name: '青岛',   lng: 120.38, lat: 36.07, fault: 72,  alarm: 3,  hi: 0.66 },
            { id: 2, name: '大连',   lng: 121.62, lat: 38.92, fault: 41,  alarm: 2,  hi: 0.73 },
            { id: 3, name: '上海',   lng: 121.48, lat: 31.22, fault: 31,  alarm: 1,  hi: 0.80 },
            { id: 4, name: '厦门',   lng: 118.10, lat: 24.46, fault: 29,  alarm: 0,  hi: 0.84 },
            { id: 5, name: '深圳',   lng: 114.05, lat: 22.55, fault: 36,  alarm: 1,  hi: 0.77 },
            { id: 6, name: '三亚',   lng: 109.50, lat: 18.25, fault: 19,  alarm: 1,  hi: 0.81 },
            { id: 7, name: '福州',   lng: 119.30, lat: 26.08, fault: 20,  alarm: 0,  hi: 0.83 },
            { id: 8, name: '天津',   lng: 117.20, lat: 39.12, fault: 26,  alarm: 0,  hi: 0.75 },
            { id: 9, name: '宁波',   lng: 121.55, lat: 29.88, fault: 22,  alarm: 1,  hi: 0.79 },
            { id:10, name: '舟山',   lng: 122.10, lat: 30.02, fault: 18,  alarm: 0,  hi: 0.82 },
        ],
        // TOP5 排行（可直接从 bases 聚合得到；这里单独提供方便展示）
        topBases: [
            { name: '青岛', value: 72 },
            { name: '大连', value: 41 },
            { name: '上海', value: 31 },
            { name: '福州', value: 20 },
            { name: '宁波', value: 22 },
        ],
        // 四类统计
        categories: [
            { name: '推进振动', value: 151 },
            { name: '吊臂振动', value: 96  },
            { name: '密封渗漏', value: 128 },
            { name: '松脱错位', value: 84  },
        ],
        // 右侧事件流
        events: [
            { ts: '2025-08-16 13:07:51', base: '青岛',   title: '推进系统振动超限', level: '高'  },
            { ts: '2025-08-16 12:55:20', base: '大连',   title: '密封渗漏概率上升', level: '中'  },
            { ts: '2025-08-16 12:41:02', base: '三亚',   title: '吊臂振动波峰异常', level: '中'  },
            { ts: '2025-08-16 12:08:39', base: '上海',   title: '连接件松动预警',   level: '低'  },
            { ts: '2025-08-16 11:51:11', base: '宁波',   title: '推进轴承温度偏高', level: '中'  },
            { ts: '2025-08-16 11:29:10', base: '厦门',   title: '风机振动急增',     level: '高'  },
        ],
    });
}
