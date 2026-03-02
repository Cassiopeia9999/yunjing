# app/services/system_task_evaluate.py  (路径可自定)

from typing import List
from app.diagnosis.common.service_registry import register_service

@register_service()          # 默认注册名 SystemTaskEvaluate
class SystemTaskEvaluate:
    """
    装置任务评估服务
    """

    def evaluate(
        self,
        confidence: float,
        remain_life: float,
        speed: float,
        end_pos: List[float],
        start_pos: List[float],
    ) -> bool:
        """
        评估一个装置是否可以完成某个出行任务
        """
        # 1. 基本有效性校验
        if not (0.0 <= confidence <= 1.0):
            return False
        if remain_life <= 0 or speed <= 0:
            return False
        if len(start_pos) != len(end_pos) or not start_pos:
            return False

        # 2. 计算所需路程 & 时间
        distance = sum((e - s) ** 2 for s, e in zip(start_pos, end_pos)) ** 0.5
        required_time = distance / speed

        # 3. 判定逻辑：剩余寿命必须大于所需时间，且置信度 > 0.5
        return remain_life > required_time and confidence > 0.5