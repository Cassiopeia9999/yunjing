// 模拟后端返回：模型名 + 像素坐标 + 其他信息
export async function getSceneItems() {
    return [
        { id:'u-101', name:'加压泵组 #1', model:'submarine',
            x:1980, y:530,  z:  0,   status:'Normal',  size:1.0, rotY:15 },
        { id:'u-102', name:'储罐 #A',     model:'765kv_tower',
            x:1740, y:200,  z: 20,   status:'Warning', size:1.1, rotY:-20 },
        { id:'u-103', name:'冷却塔 #3',   model:'red_alert_airship',
            x: 460, y:560,  z:150,   status:'Fault',   size:1.2 },
        { id:'u-104', name:'风机 #B2',    model:'red_alert_2_russia_power_plant',
            x:1180, y:1620, z:  0,   status:'Normal',  size:0.9, rotY:45 },
    ]
}
