// ✅ 你已有的导出保持不变 …
export const getKpis = () => ([
    { key:'bases',  label:'接入基地', value:12,  unit:'' },
    { key:'units',  label:'装置数量', value:86,  unit:'' },
    { key:'devices',label:'在线设备', value:2741,unit:'' },
    { key:'alarms', label:'近7天诊断',value:5412,unit:'' },
    { key:'hp',     label:'高概率',   value:326, unit:''  },
    { key:'mttr',   label:'平均MTTR', value:6.4, unit:'h' },
])

export const getTopProvinces = () => ([
    { name:'广东', value:266 }, { name:'浙江', value:185 }, { name:'山东', value:150 },
    { name:'上海', value:118 }, { name:'北京', value:132 }, { name:'四川', value:102 },
])

export const getAlarmTrend = () => ({
    x: Array.from({length: 14},(_,i)=>`D${i+1}`),
    y: [120,132,160,148,210,195,180,220,260,230,205,198,215,240]
})

export const getAlarmFeed = () => ([
    { time:'13:02:11', title:'装置#A32 高频异常',     level:'高' },
    { time:'12:55:03', title:'设备#ZX-114 轴承震动偏高', level:'中' },
    { time:'12:41:27', title:'设备#H-09 温度突升',     level:'高' },
    { time:'12:36:12', title:'装置#B08 通道噪点增多',   level:'低' },
    { time:'12:20:06', title:'设备#S-21 电流越限',     level:'中' },
])

// ✅ 建议新增：地图点位 / 连线
// 可选：更细粒度的地图 mock
export const getMapData = () => ({
    centerHub: { name: '中控中心', coord: [112.938814, 28.228209] }, // 长沙示例
    bases: [
        { name:'北京基地',  coord:[116.405285,39.904989], value: 86 },
        { name:'上海基地',  coord:[121.472644,31.231706], value: 73 },
        { name:'广州基地',  coord:[113.264385,23.129112], value: 65 },
        { name:'成都基地',  coord:[104.065735,30.659462], value: 58 },
        { name:'西安基地',  coord:[108.939621,34.343147], value: 52 },
    ],
    provStat: getTopProvinces() // 或者自己返回 [{name,value}] 列表
})

// 可选：健康占比（左侧环图）；缺省时页面会兜底
export const getHealthPie = () => ([
    { name: '正常', value: 66 },
    { name: '关注', value: 22 },
    { name: '故障', value: 12 },
])
