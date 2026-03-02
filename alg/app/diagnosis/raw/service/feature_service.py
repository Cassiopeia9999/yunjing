import json
from datetime import datetime

import numpy as np
import pyarrow as pa
import pyarrow.ipc as pa_ipc
from starlette.datastructures import UploadFile as StarletteUploadFile
from io import BytesIO
from typing import List, Dict, Any

from app.diagnosis.common.service_registry import register_service
import importlib
TYPE_CAST = {
    "str":    str,
    "string": str,          # 同义
    "int":    int,
    "integer": int,         # 同义
    "float":  float,
    "double": float,        # 同义
    "json":   lambda x: json.loads(x),
    "bool":   lambda x: x.lower() in {"true", "1", "yes", "t"},
    "boolean": lambda x: x.lower() in {"true", "1", "yes", "t"},
}


@register_service()  # 注册名默认为 FeatureComputeService
class FeatureComputeService:

    # ======= 对外主入口 =======
    def compute(self, form_data: dict) -> List[Dict[str, Any]]:
        channel_data_map: Dict[str, Dict[str, Any]] = {}

        # ---------- 1. 解析 meta ----------
        meta_raw = form_data.get("meta")
        if not meta_raw:
            raise ValueError("缺少 meta 字段")

        meta_obj = json.loads(meta_raw)

        # 兼容老字段名和新字段名
        feature_list = meta_obj.get("featureList") or []
        if not isinstance(feature_list, list):
            raise ValueError("meta.featureList 格式错误，必须为数组")

        # pointMetaMap 在新版协议中可为空
        point_meta_map_raw = meta_obj.get("pointMetaMap", {}) or {}

        # ---------- 2. 读取各通道 Arrow ----------
        channel_data_map = self._load_all_channels(form_data)

        # ---------- 3. 打印输入结构（调试） ----------
        self._analyze_input_structure(channel_data_map)

        # ---------- 4. 特征计算 ----------
        features = self._run_plugins_for_all_features(
            channel_data_map=channel_data_map,
            point_meta_map=point_meta_map_raw,
            feature_list=feature_list
        )
        return features


    def _load_all_channels(self, form_data: dict) -> Dict[str, Dict[str, Any]]:
        """
        从 multipart/form-data 中提取所有 channel_* 文件，解析为可计算用的结构。
        返回: { channel_id: {values: [...], timestamp: [...], ...}, ... }
        """
        channel_data_map: Dict[str, Dict[str, Any]] = {}

        for key, value in form_data.items():
            if not key.startswith("channel_"):
                continue
            if not isinstance(value, StarletteUploadFile):
                continue

            channel_id = key.replace("channel_", "", 1)

            value.file.seek(0)
            buf = BytesIO(value.file.read())
            if buf.getbuffer().nbytes == 0:
                print(f"⚠️ 通道 {channel_id} Arrow 为空，跳过")
                continue

            channel_data_map[channel_id] = self._parse_arrow_data(buf)

        return channel_data_map


    def _parse_arrow_data(self, buf: BytesIO) -> Dict[str, Any]:
        try:
            print(f"📥 尝试解析 Arrow 流，长度: {buf.getbuffer().nbytes} 字节")

            reader = pa_ipc.open_stream(buf)
            print(f"✅ 已打开 Arrow Stream")
            table: pa.Table = reader.read_all()
            print(f"✅ 成功读取 Arrow 表，共 {table.num_rows} 行，{table.num_columns} 列")

            records_dict = table.to_pydict()
            print(f"📊 转换为 Python 字典，字段: {list(records_dict.keys())}")

            result = {}
            for k, v in records_dict.items():
                preview = v[:5] if isinstance(v, list) else str(v)
                print(f"  - 字段 {k}，类型: {type(v).__name__}，前5项: {preview}")

                if k == "value":
                    result["values"] = v
                else:
                    result[k] = v

            return result

        except Exception as e:
            print(f"[Arrow解析] ❌ 异常: {e}")
            import traceback
            traceback.print_exc()
            return {"values": [], "error": str(e)}

    def _analyze_input_structure(self,
                                 channel_data_map: Dict[str, Any]) -> None:
        """
        分析 channel_data_map 的结构信息：
        - 支持字段为 data 或 values；
        - 打印字段类型与最多 100 项数据预览；
        """
        print("\n📦 [特征计算---------结构分析] channel_data_map 结构信息：")

        for channel_id, content in channel_data_map.items():
            print(f"\n🔹 通道 {channel_id}：")

            if not isinstance(content, dict):
                print(f"    ❌ 类型异常：期望 dict，实际为 {type(content).__name__}")
                continue

            print(f"    类型: dict（字段如下）")
            for k, v in content.items():
                field_type = type(v).__name__
                print(f"      · {k}: {field_type}")

                # ✅ 若为数值数组字段（data / values），打印前 100 项
                if k in {"data", "values"} and isinstance(v, list):
                    print(f"        ⮡ {k} 是列表，共 {len(v)} 项")

                    first_item = v[0] if v else None

                    # 情况1：一维数值列表
                    if first_item is not None and isinstance(first_item, (float, int)):
                        preview = v[:100]
                        print(f"        ⮡ 元素类型: {type(first_item).__name__}，前100项：")
                        print(f"           [{', '.join(str(round(x, 6)) for x in preview)}]")
                        if len(v) > 100:
                            print(f"           ...（已省略 {len(v) - 100} 项）")

                    # 情况2：二维嵌套数值列表
                    elif isinstance(first_item, list):
                        print(f"        ⮡ {k} 是嵌套列表（List[List]），子项数量: {len(first_item)}")
                        preview_sub = first_item[:100]
                        print(f"           ⮡ 第1项子列表前100项: [{', '.join(str(round(x, 6)) for x in preview_sub)}]")
                        if len(first_item) > 100:
                            print(f"           ...（已省略 {len(first_item) - 100} 项）")

                    else:
                        print("        ⮡ 无法识别列表元素结构，略过")


    def _run_plugins_for_all_features(
            self,
            channel_data_map: Dict[str, Any],
            point_meta_map: Dict[str, Dict[str, Any]],
            feature_list: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        遍历 feature_list（每个元素代表一个待计算的特征）并执行对应的计算插件。
        每个特征:
          - compute_methond: 要加载的计算模块
          - para_list: 参数配置
          - cal_channel_list: 该特征需要参与计算的通道列表
        """
        results: List[Dict[str, Any]] = []

        # 兜底，防止 None
        if point_meta_map is None:
            point_meta_map = {}

        for feature in feature_list:
            method_module_name = feature.get("compute_methond")
            if not method_module_name:
                print(f"⚠️ 特征缺少 compute_methond 字段，跳过: {feature}")
                feature["error"] = "缺少 compute_methond"
                results.append(feature)
                continue

            try:
                # 动态导入计算模块
                module = importlib.import_module(
                    f"app.diagnosis.feature_plugins.compute.{method_module_name}"
                )

                if not hasattr(module, "compute"):
                    print(f"❌ 模块 {method_module_name} 不包含 compute 方法")
                    feature["error"] = "模块不包含 compute 方法"
                    results.append(feature)
                    continue

                compute_func = module.compute

                # 组装 kwargs（参数列表 -> 算法入参）
                kwargs = {}
                for p in feature.get("para_list", []):
                    param_name = p.get("para_name")
                    raw_value = p.get("para_value")
                    value_type = str(p.get("value_type", "str")).lower()

                    caster = TYPE_CAST.get(value_type, str)
                    try:
                        kwargs[param_name] = caster(raw_value)
                    except Exception as cast_err:
                        print(f"⚠️ 参数类型转换失败: {param_name}={raw_value} 类型={value_type}, 错误: {cast_err}")
                        kwargs[param_name] = raw_value  # fallback: 保留原值

                # signal 环境，传给插件
                signal = {
                    "channel_data_map": channel_data_map,  # 所有通道的原始波形/序列
                    "point_meta_map": point_meta_map,  # 兼容旧逻辑，现在可能是 {}
                    "feature": feature  # 包含 cal_channel_list 等上下文
                }

                value = compute_func(signal, **kwargs)

                print(f"✅ 特征计算成功: {method_module_name} → {value}")

                feature["value"] = value
                feature["timestamp"] = datetime.now().isoformat()
                results.append(feature)

            except ModuleNotFoundError:
                print(f"❌ 模块加载失败: {method_module_name}")
                feature["error"] = f"找不到模块: {method_module_name}"
                results.append(feature)

            except Exception as e:
                print(f"❌ 特征计算异常: {method_module_name}, 错误: {e}")
                import traceback
                traceback.print_exc()
                feature["error"] = str(e)
                results.append(feature)

        return results



