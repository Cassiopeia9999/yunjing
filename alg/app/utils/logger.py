import logging
import os
from logging.handlers import TimedRotatingFileHandler

def init_logger():
    logger = logging.getLogger("service_logger")
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # 控制台输出
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # 文件输出
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)  # 自动创建logs目录
    log_file = os.path.join(log_dir, "service.log")

    fh = TimedRotatingFileHandler(log_file, when="midnight", interval=1, backupCount=7, encoding="utf-8")
    fh.setLevel(logging.INFO)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    return logger

def get_logger():
    return logging.getLogger("service_logger")
