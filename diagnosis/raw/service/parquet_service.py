from app.diagnosis.raw.parse.ParserFactory import get_parser


class ParquetParseService:
    @staticmethod
    def parse_to_parquet_stream(file_path: str, file_type: str = "V1"):
        print(f"[INFO] 开始解析文件: {file_path}, 使用解析器版本: {file_type}")
        parser = get_parser(file_type)
        return parser.parse_and_serialize(file_path)
