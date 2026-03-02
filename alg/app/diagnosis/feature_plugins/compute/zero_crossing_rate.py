import numpy as np
from typing import Dict, Any
from app.diagnosis.feature_plugins.compute.base import debug_signal

def compute(signal: Dict[str, Any], window_name: str = "hanning", slide_method: str = "avg") -> float:
    """
    插件：零交叉率 ZCR
    :param signal: {
        "channel_data_map": {...},
        "point_meta_map": {...},
        "feature": {...}
    }
    :param window_name: 示例参数（无实际用途）
    :param slide_method: 示例参数（无实际用途）
    :return: ZCR 值
    """
    debug_signal(signal, plugin_name="zero_crossing_rate",
                 window_name=window_name, slide_method=slide_method)

    values = signal.get("channel_data_map", {}).get("values", [])
    if not values:
        print("⚠️ values 为空，返回 0.0")
        return 0.0

    arr = np.asarray(values, dtype=np.float32)
    zero_crossings = np.where(np.diff(np.signbit(arr)))[0]
    result = len(zero_crossings) / max(len(arr) - 1, 1)

    print(f"✅ 计算结果 ZCR = {result}\n")
    return result
