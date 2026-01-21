import gcoord from 'gcoord';

// 递归转换 GeoJSON 坐标数组
export function transformGeoJSONCoords(coordinates, type = 'WGS84_TO_GCJ02') {
    if (!coordinates || coordinates.length === 0) return coordinates;

    // 简单判断坐标深度，处理 Point, LineString, Polygon
    const isCoord = (arr) => typeof arr[0] === 'number';

    const transform = (coords) => {
        if (isCoord(coords)) {
            if (type === 'WGS84_TO_GCJ02') {
                return gcoord.transform(coords, gcoord.WGS84, gcoord.GCJ02);
            }
            return coords;
        }
        return coords.map(transform);
    };

    return transform(coordinates);
}