import io
import struct
from typing import Tuple

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq

from app.diagnosis.raw.parse.ParserBase import ParserBase


class EightByteFileParserV1(ParserBase):
    def __init__(self, encoding='utf-8'):
        self.encoding = encoding  # 支持切换utf-8、gbk等

    def parse_and_serialize(self, file_path: str) -> Tuple[io.BytesIO, list]:
        parsed = self.parse(file_path)
        buf = self.to_parquet_bytes(parsed)
        meta = parsed.get("meta", [])
        return buf, meta

    def parse(self, file_path):
        with open(file_path, 'rb') as f:
            data_records = []
            meta_records = []
            data_lens = []
            DataLenEnd = np.array([-1, -1, -1, -1, -1], dtype=int)

            # --- 索引区 ---
            dt = f.read(8)
            if not dt or len(dt) < 8:
                return {
                    "meta": [], "data": []
                }

            data_lenth = struct.unpack('>4b1i', dt)
            DataLen = np.array(data_lenth, dtype=int)

            while not np.allclose(DataLen, DataLenEnd):
                data_lens.append(DataLen)
                dt = f.read(8)
                if not dt or len(dt) < 8:
                    break
                data_lenth = struct.unpack('>4b1i', dt)
                DataLen = np.array(data_lenth, dtype=int)

            # --- 数据区 ---
            for dataLen in data_lens:
                dataset = {}

                # typeName
                dt = f.read(dataLen[0])
                fmt = f">{dataLen[0]}s"
                buffers, = struct.unpack(fmt, dt)
                dataset['typeName'] = buffers.strip(b'\x00').decode(self.encoding, errors='replace')

                # channelName
                if dataLen[1] != 0:
                    dt = f.read(dataLen[1])
                    fmt = f">{dataLen[1]}s"
                    buffers, = struct.unpack(fmt, dt)
                    dataset['channelName'] = buffers.strip(b'\x00').decode(self.encoding, errors='replace')
                else:
                    dataset['channelName'] = ""

                # unit
                if dataLen[2] != 0:
                    dt = f.read(dataLen[2])
                    fmt = f">{dataLen[2]}s"
                    buffers, = struct.unpack(fmt, dt)
                    dataset['unit'] = buffers.strip(b'\x00').decode(self.encoding, errors='replace')
                else:
                    dataset['unit'] = ""

                # Data
                if dataLen[4] != 0:
                    try:
                        if dataLen[3] == 1:
                            dt = f.read(dataLen[4])
                            fmt = f">{dataLen[4]}?"
                            dataset['data'] = list(struct.unpack(fmt, dt))
                        elif dataLen[3] == 2:
                            dt = f.read(dataLen[4])
                            fmt = f">{dataLen[4]}b"
                            dataset['data'] = list(struct.unpack(fmt, dt))
                        elif dataLen[3] == 3:
                            dt = f.read(dataLen[4] * 2)
                            fmt = f">{dataLen[4]}h"
                            dataset['data'] = list(struct.unpack(fmt, dt))
                        elif dataLen[3] == 4:
                            dt = f.read(dataLen[4] * 4)
                            fmt = f">{dataLen[4]}i"
                            dataset['data'] = list(struct.unpack(fmt, dt))
                        elif dataLen[3] == 5:
                            dt = f.read(dataLen[4] * 4)
                            fmt = f">{dataLen[4]}f"
                            dataset['data'] = list(struct.unpack(fmt, dt))
                        elif dataLen[3] == 6:
                            dt = f.read(dataLen[4] * 8)
                            fmt = f">{dataLen[4]}d"
                            dataset['data'] = list(struct.unpack(fmt, dt))
                        elif dataLen[3] == 7:
                            dt = f.read(dataLen[4])
                            fmt = f">{dataLen[4]}s"
                            buffers, = struct.unpack(fmt, dt)
                            dataset['data'] = buffers.strip(b'\x00').decode(self.encoding, errors='replace')
                        else:
                            dataset['data'] = []
                    except Exception as e:
                        dataset['data'] = f"[ERROR PARSING DATA] {e}"
                else:
                    dataset['data'] = ""

                # 分类
                if (dataset.get("typeName") or "").strip() == "通道数据":
                    data_records.append(dataset)
                else:
                    meta_records.append(dataset)

            print(f"[INFO] 本次解析完成：meta={len(meta_records)} 条，data={len(data_records)} 条")

            if meta_records:
                print("[DEBUG] meta 记录详情：")
                for idx, meta in enumerate(meta_records):
                    print(f"  [meta-{idx + 1}] {meta}")

            if data_records:
                print("[DEBUG] data 记录摘要：")
                for idx, data in enumerate(data_records):
                    summary = {
                        "typeName": data.get("typeName", ""),
                        "channelName": data.get("channelName", ""),
                        "unit": data.get("unit", ""),
                        "data_len": len(data.get("data", [])) if isinstance(data.get("data"), list) else 0
                    }
                    print(f"  [data-{idx + 1}] {summary}")
                    if idx >= 9:
                        print("  ... （仅展示前10条）")
                        break

            return {
                "meta": meta_records,
                "data": data_records
            }

    def to_parquet_bytes(self, parsed_result: dict) -> io.BytesIO:
            """
            将解析后的结构化数据转换为 Parquet 字节流，只处理 data 部分（保留 list 类型）
            """
            data_records = parsed_result.get("data", [])
            if not data_records:
                raise ValueError("无有效 data 记录，无法生成 Parquet")

            type_names = [r.get('typeName', '') for r in data_records]
            channel_names = [r.get('channelName', '') for r in data_records]
            units = [r.get('unit', '') for r in data_records]
            data_lists = [r.get('data', []) for r in data_records]

            schema = pa.schema([
                ("typeName", pa.string()),
                ("channelName", pa.string()),
                ("unit", pa.string()),
                ("data", pa.list_(pa.float32()))
            ])

            table = pa.table({
                "typeName": type_names,
                "channelName": channel_names,
                "unit": units,
                "data": data_lists
            }, schema=schema)

            print(f"[INFO] Arrow 表构建成功：{table.num_rows} 行, {table.num_columns} 列")

            buf = io.BytesIO()
            pq.write_table(table, buf)
            buf.seek(0)
            return buf
