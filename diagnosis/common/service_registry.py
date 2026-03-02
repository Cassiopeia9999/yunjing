# app/common/service_registry.py
import inspect
from typing import Any, Dict, Callable

__all__ = ["register_service", "SERVICE_REGISTRY"]

SERVICE_REGISTRY: Dict[str, Any] = {}


def register_service(name: str = None) -> Callable:
    """
    装饰器：将类实例注册到 SERVICE_REGISTRY
    用法:
        @register_service()
        class MyService: ...
        @register_service("AliasName")
        class Other: ...
    """
    def decorator(cls):
        svc_name = name or cls.__name__
        # 单例化：直接存实例，也可按需存 cls
        SERVICE_REGISTRY[svc_name] = cls()
        return cls
    return decorator
