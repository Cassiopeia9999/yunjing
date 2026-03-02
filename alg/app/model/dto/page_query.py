import json
from typing import List, Optional, Any

class QueryParamVO:
    def __init__(self, key: str, value: Any, query_type: Optional[int] = None):
        self.key = key
        self.value = value
        self.query_type = query_type

    def to_dict(self):
        return {
            "key": self.key,
            "value": self.value,
            "queryType": self.query_type
        }

class PageQuery:
    def __init__(self, page_no: int = 1, page_size: int = 10, form_id: str = "22"):
        self.page_no = page_no
        self.page_size = page_size
        self.form_id = form_id
        self.query_params: List[QueryParamVO] = []

    def add_query_param(self, key: str, value: Any, query_type: Optional[int] = None):
        self.query_params.append(QueryParamVO(key, value, query_type))

    def to_dict(self):
        return {
            "pageNo": self.page_no,
            "pageSize": self.page_size,
            "formId": self.form_id,
            "queryParamVOs": json.dumps([param.to_dict() for param in self.query_params]),  # <<< 核心改这里！
            "cardMode": False
        }
