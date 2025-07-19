#!/bin/bash

echo "🚀 启动手脚架开发环境"
echo "================================"

# 存储所有子进程PID
PIDS=()

# 检查是否安装了必要的依赖
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: Python3 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
fi

# 函数：启动后端服务
start_backend() {
    echo "🐍 启动 Python 后端服务..."
    cd backend
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        echo "📦 创建 Python 虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境并安装依赖
    echo "📋 安装/更新 Python 依赖..."
    source venv/bin/activate && pip install -r requirements.txt
    
    # 启动后端（使用完整路径确保虚拟环境）
    echo "🔥 启动 FastAPI 服务器 (端口: 8000)..."
    (source venv/bin/activate && cd app && uvicorn main:app --host 127.0.0.1 --port 8000 --reload) &
    BACKEND_PID=$!
    PIDS+=($BACKEND_PID)
    echo "后端进程 PID: $BACKEND_PID"
    
    cd ..
}

# 函数：启动前端服务
start_frontend() {
    echo "⚛️  启动 React 前端服务..."
    cd web
    
    # 检查并安装前端依赖
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        echo "📦 安装/更新前端依赖..."
        npm install
    else
        echo "✅ 前端依赖已是最新"
    fi
    
    echo "🔥 启动 Vite 开发服务器..."
    npm run tauri dev &
    FRONTEND_PID=$!
    PIDS+=($FRONTEND_PID)
    echo "前端进程 PID: $FRONTEND_PID"
    
    cd ..
}

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    
    # 首先尝试优雅地停止所有PID
    for pid in "${PIDS[@]}"; do
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "正在停止进程 $pid..."
            kill -TERM "$pid" 2>/dev/null
        fi
    done
    
    # 等待一小会儿让进程优雅关闭
    sleep 2
    
    # 强制杀死还在运行的进程
    for pid in "${PIDS[@]}"; do
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "强制停止进程 $pid..."
            kill -KILL "$pid" 2>/dev/null
        fi
    done
    
    # 杀死所有相关进程（额外保障）
    echo "清理相关进程..."
    pkill -f "uvicorn.*main:app" 2>/dev/null
    pkill -f "tauri dev" 2>/dev/null
    pkill -f "vite.*--port.*1420" 2>/dev/null
    
    # 清理可能残留的端口占用
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:1420 | xargs kill -9 2>/dev/null || true
    
    echo "✅ 所有服务已停止"
    echo "👋 开发环境已关闭"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 检查项目结构
echo "📁 检查项目结构..."
if [ ! -d "backend" ]; then
    echo "❌ 错误: 找不到 backend 目录"
    exit 1
fi

if [ ! -d "web" ]; then
    echo "❌ 错误: 找不到 web 目录"
    exit 1
fi

echo "✅ 项目结构正常"
echo ""

# 启动服务
start_backend
sleep 3  # 等待后端启动
start_frontend

echo ""
echo "🎉 开发环境启动完成!"
echo "📚 前端地址: http://localhost:1420"
echo "🔧 后端地址: http://localhost:8000"
echo "📖 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待任一子进程结束（如果有进程异常退出，会自动清理）
while true; do
    # 检查是否还有活跃的进程
    active_processes=0
    for pid in "${PIDS[@]}"; do
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            ((active_processes++))
        fi
    done
    
    # 如果没有活跃进程了，退出
    if [ $active_processes -eq 0 ]; then
        echo "⚠️  所有进程已退出"
        cleanup
    fi
    
    sleep 1
done 