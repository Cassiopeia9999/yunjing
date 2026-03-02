# app/common/service_invoker.py
import inspect
import time
import logging
import asyncio
from typing import Any, Dict, Callable

from app.diagnosis.common.service_registry import SERVICE_REGISTRY

logger = logging.getLogger("service_invoker")

class ServiceInvoker:

    @classmethod
    def invoke(cls, service_name: str, method_name: str, params: Dict[str, Any]) -> Any:
        print(f"📡 开始调用服务: {service_name}.{method_name}")
        print(f"🧩 当前已注册服务: {list(SERVICE_REGISTRY.keys())}")

        if service_name not in SERVICE_REGISTRY:
            raise ValueError(f"未找到服务: {service_name}")

        service = SERVICE_REGISTRY[service_name]
        method: Callable = getattr(service, method_name, None)

        if method is None:
            raise ValueError(f"服务 {service_name} 中未找到方法: {method_name}")

        if not callable(method):
            raise TypeError(f"{method_name} 不是可调用方法")

        sig = inspect.signature(method)
        bound = sig.bind_partial()
        bound.apply_defaults()

        print(f"📤 开始执行方法: {method_name}，参数: {params}")
        return method(**params)

