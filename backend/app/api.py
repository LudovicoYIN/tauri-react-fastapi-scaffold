from fastapi import APIRouter
from pydantic import BaseModel
import datetime

router = APIRouter()

# 请求模型
class EchoRequest(BaseModel):
    message: str

class HelloResponse(BaseModel):
    message: str
    timestamp: str

class EchoResponse(BaseModel):
    echo: str
    original: str
    timestamp: str

@router.get("/hello", response_model=HelloResponse)
async def get_hello():
    """获取后端 Hello 消息"""
    return HelloResponse(
        message="Hello from Python FastAPI Backend! 🐍",
        timestamp=datetime.datetime.now().isoformat()
    )

@router.post("/echo", response_model=EchoResponse)
async def echo_message(request: EchoRequest):
    """回显消息"""
    return EchoResponse(
        echo=f"服务器收到：{request.message}",
        original=request.message,
        timestamp=datetime.datetime.now().isoformat()
    )

@router.get("/status")
async def get_status():
    """获取服务状态"""
    return {
        "status": "running",
        "service": "FastAPI Backend",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now().isoformat()
    } 