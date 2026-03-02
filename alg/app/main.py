from fastapi import FastAPI

from app.diagnosis.predict_plugins.prediction_service import PredictionService
from app.routers.api import router as api_router
from app.routers.external_api_router import router as external_api_router
from app.routers.health import router as health_router
from app.registry import register_service, deregister_service
from app.utils.logger import init_logger
# 放在所有 import 最后即可，确保装饰器被执行
import app.diagnosis.other_plugins.system_task_evaluate  # noqa: F401
from app.diagnosis.maintain_plugins.repair_decision_service import RepairDecisionService  # noqa: F401
from app.diagnosis.feature_plugins.inspection_service import InspectionService
 

app = FastAPI(title="Python FastAPI Service", version="1.0.0")

# 初始化日志
logger = init_logger()
# 注册路由
# 注册业务接口
app.include_router(api_router)
# 注册外部API测试接口
app.include_router(external_api_router)
# 注册健康检查接口
app.include_router(health_router)


@app.on_event("startup")
async def on_startup():
    logger.info("服务启动中...")
    # register_service()

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("服务关闭中...")
    deregister_service()