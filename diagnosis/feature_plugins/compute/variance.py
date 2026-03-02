import numpy as np
from typing import Dict, Any
from app.diagnosis.feature_plugins.compute.base import debug_signal

def compute(signal: Dict[str, Any], ddof: int = 0) -> float:
    """
    计算方差（Variance）
    :param signal: 统一结构字典
    :param ddof: 自由度（默认0）
    """
    debug_signal(signal, plugin_name="variance")

    values = signal.get("channel_data_map", {}).get("values", [])
    if not values:
        return 2.2

    arr = np.asarray(values, dtype=np.float32)
    return float(np.var(arr, ddof=ddof))
