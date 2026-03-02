import json
import random
from typing import Dict, Any, List, Tuple
from app.diagnosis.common.service_registry import register_service


@register_service()
class QualityEvaluationService:
    """
    文件质量评估服务（当前为桩实现）：
    - evaluate_file_quality: 供 FastAPI 路由调用；负责解析 multipart/form-data
    - simulate_quality_score: 伪算法，根据通道数量和原始二进制数据给出 (x,y,value)
    """

    async def evaluate_file_quality(self, form) -> Dict[str, Any]:
        """
        接收 Java 上传的 multipart/form-data:
          - meta: JSON 字符串，包含 deviceName / allPointList
          - channel_xxx: 每个通道对应的 Arrow/Parquet 二进制
        打日志并返回一个模拟的评估结果 {x, y, value}
        """

        # ========== 1. 解析 meta ==========
        meta_raw = form.get("meta")
        device_name = None
        all_point_list = []

        if meta_raw:
            try:
                meta_json = json.loads(meta_raw)
                device_name = meta_json.get("deviceName")
                all_point_list = meta_json.get("allPointList", [])
            except Exception as e:
                print(f"[质量评估] ❌ meta 字段解析失败: {e}")
        else:
            print("[质量评估] ⚠️ 未收到 meta 字段")

        # ========== 2. 收集通道原始二进制数据 ==========
        channel_payloads: List[Tuple[str, bytes]] = []  # [(channel_key, raw_bytes), ...]
        channel_info_list = []

        for key, value in form.items():
            if not key.startswith("channel_"):
                continue
            try:
                # 兼容 UploadFile / Streaming
                if hasattr(value, "read"):
                    file_bytes = await value.read()
                    await value.seek(0)
                elif isinstance(value, (bytes, bytearray)):
                    file_bytes = bytes(value)
                else:
                    file_bytes = bytes(str(value), "utf-8")

                size = len(file_bytes)
                preview = file_bytes[:12].hex(" ")

                channel_payloads.append((key, file_bytes))
                channel_info_list.append({
                    "channel_key": key,
                    "size": size,
                    "preview": preview
                })
            except Exception as ex:
                channel_info_list.append({
                    "channel_key": key,
                    "error": str(ex)
                })

        # ========== 3. 打印日志（观测数据）==========
        print("======== [质量评估] 请求内容概览 ========")
        print(f"设备名称: {device_name}")
        print(f"测点数量(allPointList): {len(all_point_list)}")
        if all_point_list:
            for i, pt in enumerate(all_point_list[:2]):
                print(f"测点[{i}] => {pt}")
        for ch in channel_info_list:
            print(f"通道上传: {ch}")
        print("=========================================")

        # ========== 4. 执行模拟质量评估算法 ==========
        quality_result = self.simulate_quality_score(channel_payloads=channel_payloads)

        print(f"[质量评估] ✅ 模拟结果: {quality_result}")
        return quality_result

    # ==============================================================
    # 🔸 模拟质量评估算法
    # ==============================================================
    def simulate_quality_score(
            self,
            channel_payloads: List[Tuple[str, bytes]]
    ) -> Dict[str, Any]:
        """
        伪算法 / 模拟逻辑：
        入参:
            channel_payloads: [(channel_key, bytes), ...]
                - channel_key 是类似 "channel_3"
                - bytes 是该通道对应的 Arrow/Parquet 二进制内容
        输出:
            { "x": float, "y": float, "value": float }

        现在的实现思路（可后续替换为真算法）：
          - 用通道数量、通道数据长度做简单扰动计算
          - 保持结构 {x,y,value}
        """

        channel_count = len(channel_payloads)
        avg_size = 0.0
        if channel_count > 0:
            total = sum(len(raw_bytes) for _, raw_bytes in channel_payloads)
            avg_size = total / channel_count

        # 计算归一化指标
        norm_channel = min(channel_count / 16.0, 1.0)   # 通道数量归一化
        norm_size = min(avg_size / 65536.0, 1.0)        # 平均字节量归一化

        # 随机扰动，防止每次结果完全相同
        jitter_x = random.uniform(-0.05, 0.05)
        jitter_y = random.uniform(-0.05, 0.05)

        x_val = max(0.0, min(1.0, norm_channel + jitter_x))
        y_val = max(0.0, min(1.0, norm_size + jitter_y))

        # 模拟质量分（一般偏高）
        base_quality = 0.9
        jitter_q = random.uniform(-0.05, 0.05)
        q_val = max(0.0, min(1.0, base_quality + jitter_q))

        result = {
            "x": round(x_val, 4),
            "y": round(y_val, 4),
            "value": round(q_val, 4)
        }

        # 日志输出
        print(f"[质量评估] 📊 模拟算法输入: 通道数={channel_count}, avg_size={avg_size:.2f} bytes/通道")
        print(f"[质量评估] 📊 模拟算法输出: {result}")

        return result
