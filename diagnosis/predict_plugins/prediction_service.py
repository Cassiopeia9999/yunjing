"""
PredictionService
设备级寿命预测
"""

import json
import random
from typing import Dict, Any
from app.diagnosis.common.service_registry import register_service
import numpy as np
from typing import List, Dict, Any

@register_service()
class PredictionService:
    """
    根据特征集合返回剩余寿命、健康度及置信度
    """

    def predict_device(
        self,
        *,
        device_name: str,
        algorithm: str = "rf",          # 算法名称，可扩展
        features: Dict[str, float],     # 已反序列化的特征 dict
    ) -> Dict[str, Any]:
        """
        设备级寿命预测

        参数
        ----
        device_name : str
            设备编号
        algorithm : str
            预测算法标识，默认为 "rf"
        features : Dict[str, float]
            特征键值对，例如 {"temperature": 75.2, "vibration": 2.3}

        返回
        ----
        Dict[str, Any]
            {
                "device_name": str,
                "algorithm": str,
                "rul": float,        # 剩余寿命（天）
                "health": float,     # 健康度 [0,1]
                "confidence": float  # 置信度 [0,1]
            }
        """
        print(f"[PredictionSersssssvice.predi顶顶顶ct_device] 收到参数:")
        print(f"  device_name = {device_name}")
        print(f"  algorithm   = {algorithm}")
        print(f"  features    = {features}")

        # 简单随机模拟：可替换成真实模型
        base = hash(f"{device_name}_{algorithm}") % 1000
        rnd = random.Random(base)

        rul = round(rnd.uniform(10.0, 365.0), 1)
        health = round(rnd.uniform(0.5, 1.0), 2)
        confidence = round(rnd.uniform(0.7, 0.99), 2)

        return {
            "device_name": device_name,
            "algorithm": algorithm,
            "rul": rul,
            "health": health,
            "confidence": confidence,
        }

    def trend_forecast(
            self,
            device_name: str,
            feature_name: str,
            history_data: List[Dict[str, Any]],
            predict_points: int,
            window_size: int
    ) -> List[Dict[str, Any]]:
        """
        简单趋势预测服务：基于线性回归对特征值做趋势预测
        """

        print(
            f"📈 开始预测: device={device_name}, feature={feature_name}, history={len(history_data)}, predict={predict_points}")

        if len(history_data) < 2:
            raise ValueError("历史数据太少，无法进行趋势预测")

        # 提取数据（按时间排序）
        sorted_data = sorted(history_data, key=lambda x: x["cur_timestamp"])
        timestamps = [d["cur_timestamp"] for d in sorted_data]
        values = [d["feature_value"] for d in sorted_data]

        # 转换为 numpy 数组
        x = np.array(timestamps)
        y = np.array(values)

        # 简单线性拟合
        coef = np.polyfit(x, y, deg=1)
        model = np.poly1d(coef)

        print(f"🧮 线性拟合模型: y = {coef[0]:.6f} * x + {coef[1]:.6f}")

        # 平均间隔估算（预测时间点以此为基础延展）
        intervals = np.diff(x)
        avg_interval = int(np.mean(intervals))

        print(f"⏱ 平均间隔: {avg_interval} ms")

        last_time = x[-1]
        predicted = []
        for i in range(1, predict_points + 1):
            ts = last_time + i * avg_interval
            val = model(ts)
            predicted.append({
                "cur_timestamp": int(ts),
                "feature_value": float(round(val, 6))
            })

        print(f"✅ 预测完成，共 {len(predicted)} 点")

        return predicted
