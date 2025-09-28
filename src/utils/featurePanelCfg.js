// 统一的本地存储 Key
export function featureCfgKey(id) {
    return `dev_feature_cfg_${String(id)}`
}

// 读取（父页面、对话框都可复用）
export function loadFeaturePanelCfg(id) {
    try {
        const raw = localStorage.getItem(featureCfgKey(id))
        if (!raw) return null
        const obj = JSON.parse(raw)
        if (!Array.isArray(obj.order)) obj.order = []
        if (typeof obj.count !== 'number') obj.count = 8
        return obj
    } catch {
        return null
    }
}

// 保存（仅对话框用）
export function saveFeaturePanelCfg(id, cfg) {
    try {
        localStorage.setItem(featureCfgKey(id), JSON.stringify(cfg))
    } catch {}
}
