import os
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 配置项
SERVICE_NAME = os.getenv("SERVICE_NAME", "python_service")
SERVICE_IP = os.getenv("SERVICE_IP", "127.0.0.1")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8000))

DOWNLOAD_BASE_URL = os.getenv("DOWNLOAD_BASE_URL", "http://localhost").rstrip("/")
REGISTRATION_URL = os.getenv("REGISTRATION_URL", "http://localhost:48080/registry")

API_BASE_URL = os.getenv("API_BASE_URL")
API_TOKEN = os.getenv("API_TOKEN")
TENANT_ID = os.getenv("TENANT_ID")