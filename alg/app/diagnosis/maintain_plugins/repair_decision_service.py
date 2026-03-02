"""
维修决策服务
根据装置当前状态给出维修建议
"""

import json
from typing import List, Optional
from app.diagnosis.common.service_registry import register_service


@register_service()
class RepairDecisionService:
    """维修决策服务"""

    def plan_repair(
            self,
            facility_id: str,
            cycle_days: int = 30,
            rul: float = 0.0,
            health: float = 1.0,
            confidence: float = 1.0,
            fault_codes: Optional[str] = None,
    ) -> dict:
        """模拟桩：打印参数并返回固定结果"""
        print("[RepairDecisionService.plan_repair] 收到参数:")
        print(f"  facility_id = {facility_id}")
        print(f"  cycle_days  = {cycle_days}")
        print(f"  rul         = {rul}")
        print(f"  health      = {health}")
        print(f"  confidence  = {confidence}")
        print(f"  fault_codes = {fault_codes}")
        print("[RepairDecisionService.plan_repair] 收到参数:")
        # 固定模拟返回
        return {
            "need_repair": True,
            "plan_type": "routine",
            "next_check_days": 7,
            "reason": "模拟返回：参数已收到",
        }