import requests
from app.config import API_BASE_URL, API_TOKEN, TENANT_ID

class RequestManager:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {API_TOKEN}",
            "tenant-id": str(TENANT_ID),
            "Accept": "application/json",
            "Content-Type": "application/json;charset=UTF-8"
        })

    def get(self, path: str, params: dict = None):
        """
        发送GET请求
        :param path: 相对于API_BASE_URL的路径
        :param params: 查询参数
        :return: 返回JSON
        """
        url = f"{API_BASE_URL}{path}"
        response = self.session.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()

    def post(self, path: str, data: dict = None):
        """
        发送POST请求
        :param path: 相对于API_BASE_URL的路径
        :param data: 请求体
        :return: 返回JSON
        """
        url = f"{API_BASE_URL}{path}"
        response = self.session.post(url, json=data, timeout=10)
        response.raise_for_status()
        return response.json()
