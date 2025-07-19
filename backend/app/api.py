from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import datetime
import json
import openai
from typing import Optional, List, Dict
import asyncio

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

# OpenAI 相关模型
class OpenAIConfigRequest(BaseModel):
    api_key: str
    base_url: Optional[str] = None

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    api_key: str
    base_url: Optional[str] = None
    model: str = "gpt-3.5-turbo"
    stream: bool = True

# 存储OpenAI配置
openai_config = {}

@router.post("/openai/config")
async def set_openai_config(config: OpenAIConfigRequest):
    """设置OpenAI配置"""
    global openai_config
    openai_config = {
        "api_key": config.api_key,
        "base_url": config.base_url or "https://api.openai.com/v1"
    }
    return {"status": "success", "message": "OpenAI配置已保存"}

@router.post("/openai/chat")
async def chat_with_openai(request: ChatRequest):
    """与OpenAI进行聊天对话（流式响应）"""
    try:
        # 使用请求中的配置或全局配置
        api_key = request.api_key or openai_config.get("api_key")
        base_url = request.base_url or openai_config.get("base_url", "https://api.openai.com/v1")
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API密钥未提供")
        
        # 创建OpenAI客户端
        client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        # 转换消息格式
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        if request.stream:
            # 流式响应
            async def generate_stream():
                try:
                    stream = await client.chat.completions.create(
                        model=request.model,
                        messages=messages,
                        stream=True,
                        temperature=0.7
                    )
                    
                    async for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            # 发送Server-Sent Events格式的数据
                            yield f"data: {json.dumps({'content': content, 'role': 'assistant'})}\n\n"
                    
                    # 发送结束标记
                    yield "data: [DONE]\n\n"
                    
                except Exception as e:
                    error_data = {"error": str(e), "type": "api_error"}
                    yield f"data: {json.dumps(error_data)}\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/plain",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        else:
            # 非流式响应
            response = await client.chat.completions.create(
                model=request.model,
                messages=messages,
                temperature=0.7
            )
            
            return {
                "message": {
                    "role": "assistant",
                    "content": response.choices[0].message.content
                },
                "timestamp": datetime.datetime.now().isoformat()
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API调用失败: {str(e)}")

@router.get("/openai/models")
async def get_available_models():
    """获取可用的模型列表"""
    if not openai_config.get("api_key"):
        raise HTTPException(status_code=400, detail="请先配置API密钥")
    
    try:
        client = openai.AsyncOpenAI(
            api_key=openai_config["api_key"],
            base_url=openai_config.get("base_url", "https://api.openai.com/v1")
        )
        
        models = await client.models.list()
        return {
            "models": [model.id for model in models.data if "gpt" in model.id.lower()],
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}") 