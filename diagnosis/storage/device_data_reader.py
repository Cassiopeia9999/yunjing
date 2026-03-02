import os
import re
import numpy as np
import pyarrow as pa
import pyarrow.ipc as ipc
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Union, Tuple, Optional

from app.diagnosis.storage.file_fetcher import get_default_fetcher


# ✅ 使用封装好的文件获取工具（内部自带 base_url 与环境变量兼容）


class DeviceDataReader:
    """设备数据读取器（按 Java 现行写入规则对齐/兼容；支持远端路径自动下载为临时文件）"""

    def __init__(self, root_data_path: str):
        self.root = Path(root_data_path)
        # root 仍建议存在（典型是本地根）；即使不存在，远端下载也能工作
        if not self.root.exists():
            # 不强制报错，允许远端模式：
            # raise FileNotFoundError(f"数据根目录不存在: {root_data_path}")
            pass

        # 与 Java 保持一致的时间格式
        self.YEAR_MONTH_FORMAT = "%Y%m"
        self.DATE_HOUR_FORMAT = "%Y%m%d%H"
        self.MYSQL_DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
        self.ISO_DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S"

        # 文件获取器
        self.fetcher = get_default_fetcher()

    # ------------------------------ 原始数据（Arrow File）读取 ------------------------------
    def read_raw_channel_data(self,
                              device_name: str,
                              collect_time: str,
                              channel_name: str) -> Dict[str, Union[str, List[float]]]:
        """
        读取指定设备/时间/通道的一小时原始波形（与 Java resolveChannelArrowFilePath 对齐）
        - 若本地文件不存在，则按 root 相对路径从远端下载到临时文件后读取
        """
        # 1) 解析采集时间
        try:
            dt = datetime.strptime(collect_time, self.MYSQL_DATETIME_FORMAT)
        except ValueError:
            raise ValueError(f"采集时间格式错误，需为 {self.MYSQL_DATETIME_FORMAT}")

        # 2) 推导 Arrow 文件 path（本地绝对路径 + 相对路径）
        year_month = dt.strftime(self.YEAR_MONTH_FORMAT)
        date_hour = dt.strftime(self.DATE_HOUR_FORMAT)
        arrow_path = (
            self.root / "raw" / f"device_{device_name}" /
            f"channel_{channel_name}" / year_month / f"{date_hour}.arrow"
        )
        # 关键：远端下载时用 root 相对路径（POSIX 斜杠）
        rel_path = Path("raw") / f"device_{device_name}" / f"channel_{channel_name}" / year_month / f"{date_hour}.arrow"
        rel_posix = rel_path.as_posix()

        # 3) 获取可读的本地路径（本地存在则直接用；否则自动下载）
        local_file = None
        is_temp = False
        try:
            if arrow_path.exists():
                local_file = str(arrow_path)
                is_temp = False
            else:
                # 使用封装的 fetcher，从 base_url + 相对路径 下载为临时文件
                res = self.fetcher  # 默认实例
                loc = None
                # 支持上下文也可以，这里直接 get_local 以便手动清理
                loc = self.fetcher.get_local  # 缓存方法引用
                # 异步工具在 FastAPI 场景中使用，这里在同步函数中无法 await；
                # 因此：提供一个同步版兜底（如果你的 FileFetcher 只有异步方法，可在工具类中补一个同步桥）。
                # 为保持简单，这里用显式的异步运行（在非 async 环境，使用 anyio/asyncio.run）：
                import asyncio as _asyncio
                res_local = _asyncio.run(res.get_local(rel_posix))  # type: ignore
                local_file = res_local.path
                is_temp = res_local.is_temp

            # 4) 读取 Arrow（File 格式）
            with open(local_file, "rb") as f:
                reader = ipc.RecordBatchFileReader(f)
                table = reader.read_all()

            cols = table.column_names

            # 5) 兼容列名：优先使用 channelName；若没有则尝试 channel
            channel_col: Optional[str] = None
            if "channelName" in cols:
                channel_col = "channelName"
            elif "channel" in cols:
                channel_col = "channel"
            else:
                raise ValueError(f"Arrow 文件缺少通道列（期望 'channelName' 或 'channel'），实际列: {cols}")

            if "data" not in cols:
                raise ValueError(f"Arrow 文件缺少 'data' 列，实际列: {cols}")

            # 6) 转 pylist 并取第一行（通常 1 行：整个小时的数据在一个 list 列里）
            rows = table.to_pylist()
            if not rows:
                return {"channelName": channel_name, "data": []}

            first = rows[0]
            ch_val = str(first.get(channel_col, "")) if first.get(channel_col) is not None else ""
            # Java 现状可能写入字符串 "null"
            if ch_val.lower() == "null" or ch_val.strip() == "":
                ch_val = channel_name

            data_list = first.get("data") or []
            return {
                "channelName": ch_val,
                "data": [float(v) for v in data_list]
            }

        finally:
            # 7) 清理临时文件
            try:
                if is_temp and local_file and os.path.exists(local_file):
                    os.unlink(local_file)
            except Exception:
                pass

    # ------------------------------ 特征数据（二进制）读取 ------------------------------
    def read_feature_range(self,
                           device_name: str,
                           feature_name: str,
                           start_time: str,
                           end_time: str) -> List[Dict[str, Union[datetime, float]]]:
        """
        读取指定设备/特征在时间窗口内的值（对齐 Java 现行 UTC 比较逻辑）
        - 本地不存在对应 .bin 时，按 root 相对路径拼接远端 URL 下载后读取
        """
        # 1) 解析时间窗口（保持“天真”naive datetime，与 Java LocalDateTime 保持一致）
        try:
            start_dt = datetime.strptime(start_time, self.ISO_DATETIME_FORMAT)
            end_dt = datetime.strptime(end_time, self.ISO_DATETIME_FORMAT)
        except ValueError:
            raise ValueError(f"时间格式错误，需为 {self.ISO_DATETIME_FORMAT}")
        if start_dt >= end_dt:
            raise ValueError("开始时间必须早于结束时间")

        # 2) 构造涉及的月度相对路径列表（不再要求本地目录存在）
        # 例如：features/{device}/{feature}/202505.bin
        rel_paths: List[str] = []
        cur = start_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_month = end_dt.replace(day=1)
        while cur <= end_month:
            ym = cur.strftime(self.YEAR_MONTH_FORMAT)
            rel = Path("features") / device_name / feature_name / f"{ym}.bin"
            rel_paths.append(rel.as_posix())
            cur = (cur.replace(day=28) + timedelta(days=4)).replace(day=1)

        result: List[Dict[str, Union[datetime, float]]] = []

        # 3) 逐月尝试获取本地可读文件（本地或远端下载），读取后清理
        import asyncio as _asyncio
        for rel in rel_paths:
            local_file = None
            is_temp = False
            try:
                # 优先本地（根路径下）
                abs_path = self.root / Path(rel)
                if abs_path.exists():
                    local_file = str(abs_path)
                    is_temp = False
                else:
                    # 远端下载
                    res_local = _asyncio.run(self.fetcher.get_local(rel))  # type: ignore
                    local_file = res_local.path
                    is_temp = res_local.is_temp

                # 二进制文件结构：每条记录16字节（8字节long + 8字节double，小端）
                data = np.fromfile(local_file, dtype=np.dtype([
                    ('timestamp', '<i8'),
                    ('value', '<f8')
                ]))

                # 与 Java 当前实现对齐：使用 UTC 还原为 naive datetime 再比较
                for item in data:
                    ts = datetime.utcfromtimestamp(int(item['timestamp']) / 1000.0)
                    if start_dt <= ts <= end_dt:
                        result.append({"timestamp": ts, "value": float(item['value'])})

            except FileNotFoundError:
                # 该月没有文件，跳过
                continue
            except Exception:
                # 某个月损坏或读取失败，跳过，不影响其他月份
                continue
            finally:
                if is_temp and local_file and os.path.exists(local_file):
                    try:
                        os.unlink(local_file)
                    except Exception:
                        pass

        # 4) 排序
        result.sort(key=lambda x: x['timestamp'])
        return result

    def read_feature_range_as_numpy(self,
                                    device_name: str,
                                    feature_name: str,
                                    start_time: str,
                                    end_time: str) -> Tuple[np.ndarray, np.ndarray]:
        feats = self.read_feature_range(device_name, feature_name, start_time, end_time)
        if not feats:
            return np.array([], dtype=np.int64), np.array([], dtype=np.float64)
        ts = np.array([int(v['timestamp'].timestamp() * 1000) for v in feats], dtype=np.int64)
        vals = np.array([float(v['value']) for v in feats], dtype=np.float64)
        return ts, vals


# ------------------------------ 使用示例 ------------------------------
if __name__ == "__main__":
    reader = DeviceDataReader(root_data_path="C:\\TempParquet")

    # 1) 原始通道
    try:
        raw = reader.read_raw_channel_data(
            device_name="Valve",
            collect_time="2025-05-26 19:00:00",
            channel_name="EVA"
        )
        print(f"原始数据：通道={raw['channelName']}，长度={len(raw['data'])}")
        print(f"前10个采样：{raw['data'][:10]}")
    except Exception as e:
        print(f"原始数据读取失败：{e}")

    # 2) 特征窗口（UTC 对齐 Java 现状）
    try:
        feats = reader.read_feature_range(
            device_name="Valve",
            feature_name="peak_value",
            start_time="2025-05-01T00:00:00",
            end_time="2025-05-31T23:59:59"
        )
        print(f"\n特征条数：{len(feats)}")
        if feats:
            print(f"第一条：{feats[0]['timestamp']} -> {feats[0]['value']}")
            print(f"最后一条：{feats[-1]['timestamp']} -> {feats[-1]['value']}")
    except Exception as e:
        print(f"特征数据读取失败：{e}")

    # 3) numpy 形式
    try:
        ts_arr, val_arr = reader.read_feature_range_as_numpy(
            device_name="Valve",
            feature_name="peak_value",
            start_time="2025-05-01T00:00:00",
            end_time="2025-05-31T23:59:59"
        )
        print(f"\nnp 数组：ts={len(ts_arr)}, vals={len(val_arr)}")
    except Exception as e:
        print(f"numpy 特征读取失败：{e}")
