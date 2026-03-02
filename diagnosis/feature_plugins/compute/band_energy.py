import numpy as np
from typing import Dict, Any
from app.diagnosis.feature_plugins.compute.base import debug_signal

def compute(signal: Dict[str, Any], sample_rate: int = 30000, band_range: list[float] = None) -> list[float]:
    """
    插件：频带能量 BE
    :param signal: {
        "channel_data_map": {...},
        "point_meta_map": {...},
        "feature": {...}
    }
    :param band_range: 示例参数（无实际用途）
    :return: BE值
    """
    debug_signal(signal, plugin_name="band_energy", sample_rate=sample_rate, band_range=band_range)

    values = signal.get("channel_data_map", {}).get("values", [])
    if not values or sample_rate==0 or len(band_range) <= 1:
        print("⚠️ 输入值不符合要求，返回 0.0")
        return 0.0

    arr = np.asarray(values, dtype=np.float32)
    freqs = np.array(band_range* len(arr) / sample_rate[0], dtype=np.int)
    result = []
    # EVAE_fft这个变量弄成全局变量，可缓存。
    EVAE_fft = np.abs(np.fft.fft(arr)) / len(arr) * 2

    for i in range(len(freqs) - 1):
        fft_rms = np.sqrt(np.sum(EVAE_fft[freqs[i]:freqs[i + 1]] ** 2) / 2.)
        result.append(fft_rms)

    print(f"✅ 计算结果 BE = {result}\n")
    return result