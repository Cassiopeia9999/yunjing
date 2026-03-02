import random
import traceback
from typing import List, Dict

from app.diagnosis.common.service_registry import register_service
from app.diagnosis.utils.fault_definitions import FAULT_DEFINITIONS

import random
import traceback
from typing import List, Dict, Any


# 假设 FAULT_DEFINITIONS 已在别处定义
# FAULT_DEFINITIONS = {...}
@register_service()  # 注册名默认为 StateDiagnosisService
class StateDiagnosisService:

    def evaluate_state(self, device_name: str, features: List[Dict]) -> Dict:
        """
        模拟设备状态评估逻辑（返回结构化 JSON 对象）
        """
        print(f"[状态评估] 设备: {device_name}，特征数: {len(features)}")

        avg_value = sum(
            f.get("value", 0) for f in features if isinstance(f.get("value", 0), (int, float))
        ) / max(1, len(features))

        if avg_value > 80:
            return {
                "code": 1,
                "label": "高报",
                "description": "特征值显著偏高，可能存在异常状态"
            }
        elif avg_value > 50:
            return {
                "code": 2,
                "label": "低报",
                "description": "特征值偏高，建议监测"
            }
        else:
            return {
                "code": 1,
                "label": "高报",
                "description": "设备状态正常，无需干预"
            }

    def predict_dev_lifetime(self, window_size: int, features: List[Dict], device_info: Dict) -> Dict:
        """
        处理设备寿命评估请求：打印传入参数，模拟返回寿命和置信度
        """
        # 打印传入的参数
        print(f"[寿命评估] 窗口大小: {window_size}")
        print(f"[寿命评估] 设备信息: {device_info}")
        print(f"[寿命评估] 特征数量: {len(features)}")
        if features:
            print(f"[寿命评估] 特征示例: {features[0]}")  # 打印第一个特征示例

        # 模拟返回寿命和置信度（可根据业务逻辑调整模拟规则）
        # 这里简单模拟：特征数越多，寿命预测越精准，置信度越高
        feature_count = len(features)
        lifetime = 365 - feature_count * 5  # 模拟寿命随特征数递减
        confidence = 80 + feature_count * 2  # 模拟置信度随特征数递增
        confidence = min(95, max(60, confidence))  # 限制置信度在60-95之间

        return {
            "lifetime": max(30, lifetime),  # 寿命至少30天
            "confidence": confidence,
            "message": "模拟寿命评估完成......"
        }

    def diagnose_fault(
            self,
            device_name: str,
            features: List[Dict],
            latest_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        模拟故障诊断逻辑：随机选一个故障，包含日志与异常捕获
        """
        try:
            latest_data = latest_data or {}  # None -> 空 dict

            print(f"[故障诊断] 🔧 开始诊断设备: {device_name}")
            print(f"[故障诊断] 📦 特征数量: {len(features)}")
            print(f"[故障诊断] 📊 最新数据: {latest_data}")

            for i, f in enumerate(features[:3]):
                print(f"[故障诊断] 特征[{i}] = {f}")

            fault_code_list = list(FAULT_DEFINITIONS.keys())
            print(f"[故障诊断] 🗂️ 可用故障编码列表: {fault_code_list}")

            fault_code = random.choice(fault_code_list)
            fault_info = FAULT_DEFINITIONS.get(fault_code)

            if fault_info is None:
                raise ValueError(f"无法根据 fault_code={fault_code} 找到定义")

            result = {
                "device": device_name,
                "fault_type": fault_info["name"],
                "fault_code": fault_info["code"],
                "fault_level": fault_info["level"],
                "description": fault_info["desc"],
                "confidence": round(random.uniform(0.85, 0.99), 2)
            }

            print(f"[故障诊断] ✅ 诊断结果: {result}")
            return result

        except Exception as e:
            print("[故障诊断] ❌ 诊断过程中出现异常")
            traceback.print_exc()
            return {
                "device": device_name,
                "fault_type": "诊断失败",
                "fault_code": "ERROR",
                "fault_level": "未知",
                "description": str(e),
                "confidence": 0.0
            }
