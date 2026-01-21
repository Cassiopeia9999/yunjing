// 样式策略函数
const getSeverityColor = (severity) => {
    const colors = {
        'DL_WORST': '#ff4d4f',  // 严重 - 红
        'DL_MEDIUM': '#faad14', // 一般 - 黄
        'DL_NORMAL': '#1890ff', // 轻微 - 蓝
        'default': '#52c41a'    // 其他 - 绿
    };
    return colors[severity] || colors['default'];
};

export const BUSINESS_LAYERS_CONFIG = [
    {
        id: 'surface_disease',
        name: '表观病害',
        type: 'geojson',
        zIndex: 500,   // 默认层级
        visible: true,
        needTransform: true, // 是否需要 WGS84 -> GCJ02 转换
        // 过滤器：根据你的数据结构，这里定义如何筛选该图层的数据
        filter: (feature) => feature.properties.typeName === '表观病害',
        // 样式工厂
        style: (feature) => ({
            color: 'white',
            weight: 1,
            fillColor: getSeverityColor(feature.properties.severity),
            fillOpacity: 0.7
        }),
        // 弹窗模板
        popupTemplate: (props) => `
      <div class="gis-popup">
        <b>${props.disType}</b> (${props.severity})<br/>
        状态: ${props.status}
      </div>
    `
    },
    {
        id: 'internal_disease',
        name: '内部病害',
        type: 'geojson',
        zIndex: 490,
        visible: false, // 默认关闭
        needTransform: true,
        filter: (feature) => feature.properties.typeName === '内部病害',
        style: () => ({ color: '#722ed1', weight: 2, fillOpacity: 0.5 }),
        popupTemplate: (props) => `<b>内部隐患:</b> ${props.disType}`
    }
];