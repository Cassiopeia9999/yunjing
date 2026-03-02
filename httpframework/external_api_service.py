from app.model.dto.page_query import PageQuery
from app.httpframework.request_manager import RequestManager

class ExternalApiService:
    """
    管理所有外部Java服务的接口调用
    """

    request_manager = RequestManager()

    @classmethod
    def query_list_page(cls, page_query: PageQuery):
        """
        查询在线代码列表（分页带过滤）
        """
        path = "/api/onlinecode/queryListPage"
        payload = page_query.to_dict()

        response = cls.request_manager.post(path, data=payload)
        if response.get("code") != 0:
            raise Exception(f"外部服务返回错误: {response.get('msg', '未知错误')}")

        data = response.get("data", {})
        return {
            "list": data.get("list", []),
            "total": data.get("total", 0)
        }

    @classmethod
    def insert_data(cls, form_id: str, variables: dict):
        """
        插入新数据
        :param form_id: 表单ID
        :param variables: 填写的字段数据
        :return: 返回插入是否成功
        """
        path = "/api/onlinecode/insertData"

        payload = {
            "formId": form_id,
            "variables": variables
        }

        response = cls.request_manager.post(path, data=payload)

        if response.get("code") != 0:
            raise Exception(f"外部服务返回错误: {response.get('msg', '未知错误')}")

        return response.get("data", False)  # 返回True/False

    @classmethod
    def get_some_data(cls, id: int):
        """
        查询某个具体数据
        """
        path = f"/api/onlinecode/get?id={id}"
        return cls.request_manager.get(path)

    @classmethod
    def create_entry(cls, payload: dict):
        """
        创建新条目（POST示例）
        """
        path = "/api/onlinecode/create"
        return cls.request_manager.post(path, data=payload)
