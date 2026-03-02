from app.diagnosis.raw.parse.ParserBase import ParserBase


class OtherFormatParser(ParserBase):
    def parse_and_serialize(self, file_path):
        # 你的其它解析逻辑
        return [{"info": "This is another parser"}]