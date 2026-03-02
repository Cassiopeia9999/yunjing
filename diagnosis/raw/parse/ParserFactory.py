import logging

from app.diagnosis.raw.parse.EightByteFileParserV1 import EightByteFileParserV1
from app.diagnosis.raw.parse.OtherFormatParser import OtherFormatParser
from app.diagnosis.raw.parse.ParserBase import ParserBase
from app.diagnosis.raw.parse.TdmsFileParserV1 import TdmsFileParserV1

logger = logging.getLogger(__name__)


def get_parser(fileType: str) -> ParserBase:
    version = fileType.upper()
    logger.info(f"选择解析器版本: {fileType}")

    if version == "SPEEDUP":
        logger.info("初始化 EightByteFileParserV1 (utf-8)")
        return EightByteFileParserV1(encoding='utf-8')  # 如需支持 gbk，可设参数
    elif version == "V2":
        logger.info("初始化 OtherFormatParser (V2)")
        return OtherFormatParser()
    elif version == "TDMS":
        logger.info("初始化 OtherFormatParser (TDMS)")
        return TdmsFileParserV1()
    elif version == "DAT":
        logger.info("初始化 OtherFormatParser (DAT)")
        return EightByteFileParserV1()
    else:
        logger.error(f"无效的版本号: {version}")
        raise ValueError(f"暂不支持的解析版本: {version}")
