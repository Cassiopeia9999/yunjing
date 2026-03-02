from fastapi import APIRouter, Body
from app.model.dto.page_query import PageQuery
from app.httpframework.external_api_service import ExternalApiService
from app.httpframework.variable_utils import VariableUtils

router = APIRouter(
    prefix="/external",
    tags=["外部服务接口"]
)

@router.get("/test-query-list-page")
def test_query_list_page(
    page_no: int = 1,
    page_size: int = 10,
    form_id: str = "22",
    name: str = None,
    status: str = None
):
    """
    测试查询在线代码列表接口（可选传分页和过滤参数）
    """
    # 创建PageQuery对象
    page_query = PageQuery(page_no=page_no, page_size=page_size, form_id=form_id)

    # 动态加查询过滤条件
    if name:
        page_query.add_query_param(key="name", value=name, query_type=9)
    if status:
        page_query.add_query_param(key="status", value=[status])

    # 调用ExternalApiService发起查询
    result = ExternalApiService.query_list_page(page_query)

    return {
        "code": 0,
        "msg": "查询成功",
        "data": result
    }

@router.post("/test-insert-data")
def test_insert_data(
    form_id: str = Body(..., description="表单ID", example="23"),
    variables: dict = Body(..., description="要插入的字段内容，不需要带_timestamp和isTrusted", example={
        "system_name": "测试系统",
        "system_type": "1",
        "install_date": "2025-04-30",
        "description": "示例描述"
    })
):
    """
    测试插入新数据接口
    - 自动补充 _timestamp 和 isTrusted 字段
    """
    # 动态补充系统字段
    prepared_variables = VariableUtils.prepare_variables(variables)
    # 调用插入
    success = ExternalApiService.insert_data(form_id=form_id, variables=prepared_variables)

    return {
        "code": 0 if success else 500,
        "msg": "插入成功" if success else "插入失败",
        "data": success
    }