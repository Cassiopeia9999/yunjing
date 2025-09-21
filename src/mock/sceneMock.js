// 模拟“装置管理”表的后端返回（字段名与后端一致）
export async function getSceneItems() {
    return [
        {
            id: 'u-101',
            system_name: '加压泵组 #1',
            model_name: 'submarine',
            x:1660, y: 500, z: -2,
            system_status: 'Normal',
            model_size: 100,
            rot_y: 90
        },
        {
            id: 'u-102',
            system_name: '储罐 #A',
            model_name: '765kv_tower',
            x: 3800, y: 1700, z: 10,
            system_status: 'Warning',
            model_size: 50,
            rot_y: -20
        },
        {
            id: 'u-103',
            system_name: '冷却塔 #3',
            model_name: 'red_alert_airship',
            x: -500, y: -500, z: 150,
            system_status: 'Fault',
            model_size: 120
        },
        {
            id: 'u-104',
            system_name: '风机 #B2',
            model_name: 'red_alert_2_russia_power_plant',
            x: 2000, y: 1400, z: 0,
            system_status: 'Normal',
            model_size: 90,
            rot_y: 45
        }
    ]
}

export function normalizeSceneItems(rows = []) {
    const toNum = (v, def = 0) => {
        const n = Number(v); return Number.isFinite(n) ? n : def
    }
    const normStatus = (s) => {
        const v = (s || '').toLowerCase()
        if (['fault','error','alarm'].includes(v)) return 'Fault'
        if (['warning','warn'].includes(v))       return 'Warning'
        if (['normal','ok'].includes(v))          return 'Normal'
        return 'Normal'
    }

    return rows.map((r, i) => {
        const id            = r.id ?? r.unit_id ?? r.system_code ?? `u-${i+1}`
        const system_name   = r.system_name ?? r.name ?? `设备 #${id}`
        const model_name    = r.model_name ?? r.model ?? r.modelCode ?? ''
        const x             = toNum(r.x, 0)
        const y             = toNum(r.y, 0)
        const z             = toNum(r.z, 0)
        const rot_y         = toNum(r.rot_y ?? r.rotY, 0)
        const model_size    = toNum(r.model_size ?? r.modelSize ?? r.size, 100)
        const system_status = normStatus(r.system_status ?? r.status ?? 'Normal')

        // 保留原字段，覆盖/补齐统一字段
        return {
            ...r,
            id, system_name, model_name, x, y, z, rot_y, model_size, system_status
        }
    })
}
