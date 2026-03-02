"""
InspectionService
检验方法执行服务（统计专用）
"""

import json
import math
import random
from typing import List, Dict, Any

from app.diagnosis.common.service_registry import register_service


@register_service()
class InspectionService:
    """
    对指定设备/特征执行一个或多个统计检验方法
    """

    def run_checks(
        self,
        *,
        device_name: str,
        feature_name: str,
        methods: str,          # JSON 字符串
    ) -> List[Dict[str, Any]]:
        """
        模拟执行检验方法，返回统一结构结果
        """
        print(f"[InspectionService.run_checks] 收到参数:")
        print(f"  device_name  = {device_name}")
        print(f"  feature_name = {feature_name}")
        print(f"  methods      = {methods}")

        # 将 JSON 字符串解析为列表
        # 1. 统一成 list
        if methods is None or methods == "":
            method_list: List[Dict[str, Any]] = [{"name": "shapiro", "alpha": 0.05}]
        elif isinstance(methods, str):
            try:
                method_list = json.loads(methods)
            except json.JSONDecodeError as e:
                return [{"method": "parse_error", "status": "error", "message": str(e)}]
        elif isinstance(methods, list):
            method_list = methods  # 已反序列化，直接取用
        else:
            return [{"method": "parse_error", "status": "error", "message": "methods 类型错误"}]

        # 生成统一格式的模拟返回值
        results = []
        base_seed = hash(f"{device_name}_{feature_name}") % 10000
        for cfg in method_list:
            method = cfg.get("name", "unknown")
            alpha = cfg.get("alpha", 0.05)

            # 固定随机种子保证可复现
            rnd = random.Random(base_seed + hash(method))
            n_obs = max(10, rnd.randint(30, 200))
            na_count = rnd.randint(0, 5)

            # 伪造统计量
            statistic = round(rnd.uniform(0.5, 2.5), 3)
            p_value = round(rnd.uniform(0.001, 0.999), 3)
            decision = "reject" if p_value < alpha else "retain"

            # 附加描述性统计
            mean_val = round(rnd.uniform(5.0, 15.0), 2)
            std_val = round(rnd.uniform(0.5, 3.0), 2)

            results.append(
                {
                    "method": method,
                    "status": "success",
                    "statistics": {
                        "statistic": statistic,
                        "p_value": p_value,
                        "alpha": alpha,
                        "decision": decision,
                        "extra": {
                            "simulated": True,
                        },
                    },
                    "sample_info": {
                        "n_obs": n_obs,
                        "na_count": na_count,
                        "mean": mean_val,
                        "std": std_val,
                    },
                }
            )
        return results