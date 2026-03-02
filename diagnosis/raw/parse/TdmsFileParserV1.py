import io
import pyarrow as pa
import pyarrow.parquet as pq
from nptdms import TdmsFile

from app.diagnosis.raw.parse.ParserBase import ParserBase


class TdmsFileParserV1(ParserBase):
    def parse_and_serialize(self, file_path: str) -> tuple[io.BytesIO, list]:
        print(f"[INFO] 正在解析 TDMS 文件: {file_path}")
        parsed = self.parse(file_path)
        buf = self.to_parquet_bytes(parsed["data"])
        return buf, parsed["meta"]

    def parse(self, file_path: str) -> dict:
        tdms_file = TdmsFile.read(file_path)
        meta = []
        data = []

        print(f"[INFO] 已加载 TDMS 文件: {file_path}")
        print(f"[INFO] 发现 group 数量: {len(tdms_file.groups())}")

        for group in tdms_file.groups():
            print(f"  [GROUP] {group.name} 包含 {len(group.channels())} 个通道")
            for channel in group.channels():
                ch_data = list(channel[:])
                data_row = {
                    "group": group.name,
                    "channel": channel.name,
                    "data": ch_data
                }
                data.append(data_row)

                meta_row = {
                    "group": group.name,
                    "channel": channel.name,
                    "unit_string": channel.properties.get("unit_string", ""),
                    "display_name": channel.properties.get("display_name", ""),
                }
                meta.append(meta_row)

                print(f"    [CHANNEL] {channel.name}, 数据点数: {len(ch_data)}")

        print(f"[INFO] 解析完成: meta={len(meta)} 条, data={len(data)} 条")

        if meta:
            print(f"[DEBUG] meta 示例: {meta[0]}")
        if data:
            print(f"[DEBUG] data 示例: {{group: {data[0]['group']}, channel: {data[0]['channel']}, data_len: {len(data[0]['data'])}}}")

        return {
            "meta": meta,
            "data": data
        }

    def to_parquet_bytes(self, data_rows: list) -> io.BytesIO:
        if not data_rows:
            raise ValueError("无有效数据用于序列化为 Parquet")

        schema = pa.schema([
            ("group", pa.string()),
            ("channel", pa.string()),
            ("data", pa.list_(pa.float64())),
        ])

        table = pa.table({
            "group": [r["group"] for r in data_rows],
            "channel": [r["channel"] for r in data_rows],
            "data": [r["data"] for r in data_rows]
        }, schema=schema)

        print(f"[INFO] Arrow 表构建完成，共 {table.num_rows} 行, {table.num_columns} 列")

        buf = io.BytesIO()
        pq.write_table(table, buf)
        buf.seek(0)
        print(f"[INFO] Parquet 数据已写入内存字节流，大小约 {buf.getbuffer().nbytes} 字节")
        return buf
