import requests
from app.config import SERVICE_NAME, SERVICE_IP, SERVICE_PORT, REGISTRATION_URL
from app.utils.logger import get_logger

logger = get_logger()

def register_service():
    try:
        payload = {
            "service_name": SERVICE_NAME,
            "ip": SERVICE_IP,
            "port": SERVICE_PORT,
            "status": "UP"
        }
        requests.post(REGISTRATION_URL, json=payload)
        logger.info(f"服务注册成功: {payload}")
    except Exception as e:
        logger.error(f"服务注册失败: {e}")

def deregister_service():
    try:
        payload = {
            "service_name": SERVICE_NAME,
            "ip": SERVICE_IP,
            "port": SERVICE_PORT,
            "status": "DOWN"
        }
        requests.post(REGISTRATION_URL, json=payload)
        logger.info(f"服务注销成功: {payload}")
    except Exception as e:
        logger.error(f"服务注销失败: {e}")
