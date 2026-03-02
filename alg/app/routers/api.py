import json
import os
import uuid
from datetime import datetime
import httpx
import tempfile
from pathlib import Path

from fastapi.params import Query, File
from fastapi.responses import StreamingResponse
from fastapi import APIRouter, UploadFile, Request
from fastapi.responses import JSONResponse
from typing import Dict, Any

from uvicorn.loops import asyncio

from app.config import DOWNLOAD_BASE_URL
from app.diagnosis.common.service_invoker import ServiceInvoker
from app.diagnosis.state_diag_plugins.diagnosis_service import StateDiagnosisService
from app.diagnosis.raw.service.feature_service import FeatureComputeService
from app.diagnosis.raw.service.parquet_service import ParquetParseService
from app.diagnosis.raw.service.quality_service import QualityEvaluationService
from app.html2pdf.html_to_pdf_service import HtmlToPdfService

import asyncio

from app.diagnosis.storage.file_fetcher import get_default_fetcher

router = APIRouter(prefix="/pyapi", tags=["业务接口"])
feature_compute_service = FeatureComputeService()  # ✅ 实例名具体化
diagnosis_service = StateDiagnosisService()
quality_eval_service = QualityEvaluationService()
html_to_pdf_service = HtmlToPdfService()

@router.get("/hello")
async def say_hello():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return {
        "message": "Hello from yunjing dev platform!",
        "time": current_time
    }

# 新增：下载文件到本地临时目录
async def _download_http_file(url: str) -> str:
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(url, timeout=120)
        resp.raise_for_status()
        suffix = Path(url).suffix or ".tmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(resp.content)
            return tmp.name


@router.get("/parse-file")
async def parse_file_parquet(file_path: str = Query(...), file_type: str = Query("V1")):
    """
      file_path 可以是：
        - 本地绝对/相对路径
        - http(s) 直链
        - 相对路径（将用内部封装的 base_url 拼装下载）
      """
    fetcher = get_default_fetcher()
    res = await fetcher.get_local(file_path)

    try:
        local_path = res.path
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"文件不存在: {local_path}")

        print(f"[INFO] 开始解析文件: {local_path}, 解析器版本: {file_type}")

        # 与原逻辑一致：解析为 parquet 流与 meta
        buf, meta = ParquetParseService.parse_to_parquet_stream(local_path, file_type)

        boundary = f"----Boundary-{uuid.uuid4().hex}"

        def gen():
            # Part 1: meta JSON
            yield f"--{boundary}\r\n".encode()
            yield b'Content-Disposition: form-data; name="meta"\r\n'
            yield b'Content-Type: application/json\r\n\r\n'
            yield json.dumps(meta, ensure_ascii=False).encode("utf-8")
            yield b"\r\n"

            # Part 2: Parquet 字节流
            yield f"--{boundary}\r\n".encode()
            yield b'Content-Disposition: form-data; name="data"; filename="data.parquet"\r\n'
            yield b'Content-Type: application/octet-stream\r\n\r\n'
            yield buf.getvalue()
            yield f"\r\n--{boundary}--\r\n".encode()

        return StreamingResponse(
            gen(),
            media_type=f"multipart/mixed; boundary={boundary}"
        )

    except Exception as ex:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(ex)}
        )
    finally:
        res.cleanup()

@router.post("/compute-feature")
async def compute_feature(request: Request):
    try:
        form = await request.form()
        print(f"📨 接收到 form 表单字段: {list(form.keys())}")  # ✅ 看这里是否含有 meta 和 channel_*

        result = feature_compute_service.compute(form)
        return JSONResponse(content=result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/evaluate-state")
async def evaluate_device_state(request: Request):
    try:
        payload: Dict[str, Any] = await request.json()
        device_name = payload.get("deviceName", "")
        features = payload.get("features", [])

        result = diagnosis_service.evaluate_state(device_name, features)
        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/diagnose-fault")
async def diagnose_fault(request: Request):
    try:
        payload: Dict[str, Any] = await request.json()
        device_name = payload.get("deviceName", "")
        features = payload.get("features", [])

        result = diagnosis_service.diagnose_fault(device_name, features)
        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/evaluate-file-quality")
async def evaluate_file_quality(request: Request):
    """
    接收 Java 端上传的:
      - channel_xxx: Arrow 二进制分通道数据
      - meta: JSON (含 deviceName、allPointList)
    返回:
      { "x": ..., "y": ..., "value": ... }
    """
    try:
        form = await request.form()

        # 打印一下收到的字段名，便于排查联调
        print(f"📨 [质量评估] 收到 multipart 字段: {list(form.keys())}")

        result = await quality_eval_service.evaluate_file_quality(form)

        return JSONResponse(content=result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "message": "evaluate-file-quality 调用失败"
            }
        )


@router.post("/common_invoke")
async def common_invoke(request: Request):
    try:
        payload: Dict[str, Any] = await request.json()
        print("📥 接收到请求:", payload)

        service_obj: Dict[str, Any] = payload.get("service", {})
        service_name: str = service_obj.get("service")
        method_name: str = service_obj.get("method")
        params: Dict[str, Any] = payload.get("bizData", {})

        print(f"🔍 解析服务调用: service = {service_name}, method = {method_name}")
        print(f"🧾 参数 = {params}")

        if not service_name or not method_name:
            return JSONResponse(status_code=400, content={
                "success": False, "error": "service.service 或 service.method 字段缺失"
            })

        result = ServiceInvoker.invoke(service_name, method_name, params)

        # 🔄 支持协程调用（异步服务）
        if asyncio.iscoroutine(result) or asyncio.isfuture(result):
            result = await result

        return JSONResponse(content={"success": True, "result": result})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@router.post("/html-to-pdf")
async def convert_html_to_pdf(
    file: UploadFile = File(..., description="HTML压缩包")
):
    """
    将HTML压缩包转换为PDF文件
    """
    try:
        # 读取文件内容（异步读取）
        content = await file.read()
        
        # 直接调用异步方法
        pdf_content, filename = await html_to_pdf_service.convert_html_zip_to_pdf(content)
        
        # 返回PDF文件
        from fastapi.responses import Response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

