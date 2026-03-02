# app/common/file_fetcher.py
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx
from contextlib import asynccontextmanager


@dataclass
class LocalFetchResult:
    """本地化结果：path 为可直接读取的本地文件路径；is_temp 指示是否需用后删除"""
    path: str
    is_temp: bool = False

    def cleanup(self) -> None:
        if self.is_temp and self.path and os.path.exists(self.path):
            try:
                os.unlink(self.path)
            except Exception:
                # 清理失败不抛出，避免影响主流程
                pass


class FileFetcher:
    """
    统一“路径/URL → 本地文件”的工具：
      - 支持本地已存在的文件（直接返回）
      - 支持 http(s) 直链下载为临时文件
      - 支持相对路径用 base_url 拼装后下载
    base_url/timeout 的来源也被封装在类里（不需要路由层 import app.config）。
    """

    def __init__(self, base_url: Optional[str] = None, timeout: float = 120.0):
        self.base_url = (base_url or "").rstrip("/")
        self.timeout = timeout

    # ---------- 配置读取（封装 DOWNLOAD_BASE_URL 的来源） ----------
    @classmethod
    def from_config(cls) -> "FileFetcher":
        """
        优先顺序：
          1) app.config.DOWNLOAD_BASE_URL（若模块存在且常量存在）
          2) 环境变量 DOWNLOAD_BASE_URL
          3) 默认为空（无 base_url，仅支持本地路径与显式 URL）
        """
        base_url = None

        # 1) app.config（可选依赖）
        try:
            from app.config import DOWNLOAD_BASE_URL  # type: ignore
            if isinstance(DOWNLOAD_BASE_URL, str) and DOWNLOAD_BASE_URL.strip():
                base_url = DOWNLOAD_BASE_URL.strip()
        except Exception:
            pass

        # 2) 环境变量
        if not base_url:
            env_val = os.getenv("DOWNLOAD_BASE_URL", "").strip()
            if env_val:
                base_url = env_val

        # 3) 默认值（None）
        return cls(base_url=base_url, timeout=float(os.getenv("DOWNLOAD_TIMEOUT", "120")))

    # ---------- 工具内部 ----------
    @staticmethod
    def _is_url(s: str) -> bool:
        try:
            p = urlparse(s)
            return p.scheme in ("http", "https")
        except Exception:
            return False

    @staticmethod
    def _exists_local(p: str) -> bool:
        try:
            return Path(p).exists()
        except Exception:
            return False

    def _compose_url(self, path_or_url: str) -> Optional[str]:
        """把非本地、非绝对 URL 的路径拼成可下载的 URL；若无法拼装则返回 None。"""
        if self._is_url(path_or_url):
            return path_or_url
        if not self.base_url:
            return None
        rel = path_or_url.lstrip("/")
        return urljoin(self.base_url + "/", rel)

    async def _download_to_temp(self, url: str) -> str:
        suffix = Path(urlparse(url).path).suffix or ".tmp"
        async with httpx.AsyncClient(follow_redirects=True, timeout=self.timeout) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(resp.content)
                return tmp.name

    # ---------- 对外能力 ----------
    async def get_local(self, path_or_url: str) -> LocalFetchResult:
        """
        确保拿到“可直接读取的本地文件路径”：
          - 本地存在：直接返回（is_temp=False）
          - http(s)：下载为临时文件（is_temp=True）
          - 相对路径：用 base_url 拼接后下载（is_temp=True）
        """
        # 1) 本地已存在
        if self._exists_local(path_or_url):
            return LocalFetchResult(path=str(Path(path_or_url).resolve()), is_temp=False)

        # 2) 是 URL → 直接下载
        if self._is_url(path_or_url):
            tmp = await self._download_to_temp(path_or_url)
            return LocalFetchResult(path=tmp, is_temp=True)

        # 3) 尝试用 base_url 拼装
        composed = self._compose_url(path_or_url)
        if composed:
            tmp = await self._download_to_temp(composed)
            return LocalFetchResult(path=tmp, is_temp=True)

        raise FileNotFoundError(f"既不是本地文件也无法拼装下载 URL：{path_or_url}")

    @asynccontextmanager
    async def as_local(self, path_or_url: str):
        """
        语法糖：异步上下文使用
        示例：
            async with fetcher.as_local(file_path) as local_path:
                ...  # 使用 local_path
        退出时自动清理临时文件（若有）
        """
        res = await self.get_local(path_or_url)
        try:
            yield res.path
        finally:
            res.cleanup()


# ---------- 模块级默认实例（懒创建） ----------
_default_fetcher: Optional[FileFetcher] = None

def get_default_fetcher() -> FileFetcher:
    global _default_fetcher
    if _default_fetcher is None:
        _default_fetcher = FileFetcher.from_config()
    return _default_fetcher
