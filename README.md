# TauriStack 桌面应用开发手脚架

现代化桌面应用开发手脚架，基于 Tauri + React + FastAPI 技术栈。

[English](./README_EN.md) | [中文](./README.md)

## ✨ 特性

- 🚀 **高性能** - Tauri 打包体积小，运行速度快
- 🔄 **热重载** - 前端支持热重载，开发体验流畅
- 🐍 **Python 后端** - 使用熟悉的 Python 生态系统
- 📦 **一键构建** - 自动打包为跨平台桌面应用
- 🎨 **现代UI** - Tailwind CSS v4 + React 组件
- 🔧 **开箱即用** - 预配置开发和构建环境

## 技术栈

- **桌面应用**: Tauri (Rust)
- **前端**: React + TypeScript + Vite + Tailwind CSS v4
- **后端**: Python + FastAPI
- **通信**: 本地 RESTful API

## 环境要求

### 1. 安装 Rust

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# 访问 https://rustup.rs/ 下载安装器

# 重启终端后验证安装
rustc --version
cargo --version
```

### 2. 安装 Node.js

- 下载并安装 [Node.js](https://nodejs.org/) (推荐 20 版本)

### 3. 安装 Python

- 下载并安装 [Python](https://python.org/) (3.8+)

## 快速开始

### 开发模式

```bash
# 克隆项目
git clone <项目地址>
cd <项目名>

# 启动开发环境（自动安装依赖并启动前后端）
chmod +x start-dev.sh
./start-dev.sh
```

### 开发服务信息

启动成功后，以下服务将运行：

- **前端应用**: http://localhost:1420 (Tauri 窗口)
- **后端API**: http://127.0.0.1:8000 
- **API文档**: http://127.0.0.1:8000/docs (Swagger UI)

**停止服务**: 在终端按 `Ctrl+C` 即可停止所有服务

### 生产构建

```bash
# 一键构建可发布的桌面应用
chmod +x build-release.sh
./build-release.sh
```

构建完成后，可执行文件位于：
- **macOS**: `web/src-tauri/target/release/bundle/macos/`
- **Windows**: `web/src-tauri/target/release/bundle/msi/`
- **Linux**: `web/src-tauri/target/release/bundle/deb/`

## 项目结构

```
.
├── web/                    # 前端项目 (React + Tauri)
│   ├── src/               # React 组件
│   ├── src-tauri/         # Tauri 配置和 Rust 代码
│   └── package.json       # 前端依赖
├── backend/               # 后端项目 (Python FastAPI)
│   ├── app/              # API 路由
│   ├── build.py          # 后端打包脚本
│   └── requirements.txt   # Python 依赖
├── start-dev.sh          # 开发环境启动脚本
└── build-release.sh      # 生产构建脚本
```

## 开发说明

### 添加新的API接口

1. 在 `backend/app/api.py` 中添加新的路由：
   ```python
   @router.get("/api/v1/new-endpoint")
   async def new_endpoint():
       return {"message": "新接口"}
   ```
2. 前端调用示例：
   ```typescript
   const response = await fetch('http://127.0.0.1:8000/api/v1/new-endpoint');
   const data = await response.json();
   ```

### 修改前端界面

1. 编辑 `web/src/` 下的 React 组件
2. 使用 Tailwind CSS v4 进行样式设计：
   ```tsx
   <div className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg">
     按钮
   </div>
   ```
3. 支持热重载，保存即生效

### 自定义应用配置

编辑 `web/src-tauri/tauri.conf.json` 修改：
- **应用信息**: `productName`, `version`
- **窗口设置**: `width`, `height`, `resizable`
- **图标路径**: `icon` 数组
- **权限控制**: `allowlist` 配置

### 开发技巧

- **查看日志**: 打开浏览器开发者工具查看前端日志
- **调试API**: 访问 http://127.0.0.1:8000/docs 测试接口
- **重启后端**: 如果后端代码不生效，按 `Ctrl+C` 停止后重新运行
- **清理缓存**: 删除 `web/node_modules` 和 `backend/venv` 重新安装

## 常见问题

**Q: 开发环境启动失败？**  
A: 检查 Rust、Node.js、Python 是否正确安装，运行对应的 `--version` 命令验证

**Q: 构建失败？**  
A: 确保所有依赖都已安装，检查终端错误信息，尝试删除缓存重新安装

**Q: 如何修改应用图标？**  
A: 替换 `web/src-tauri/icons/` 目录下的图标文件，支持 `.png` 和 `.ico` 格式

**Q: 前端修改不生效？**  
A: 检查终端是否有错误，尝试刷新浏览器或重启开发服务器

**Q: 后端API无法访问？**  
A: 确认后端服务正在运行 (端口8000)，检查防火墙设置

**Q: 如何添加新的依赖？**  
A: 
- 前端：在 `web/` 目录运行 `npm install package-name`
- 后端：在 `backend/` 目录激活虚拟环境后运行 `pip install package-name`，并更新 `requirements.txt`

**Q: 应用窗口太小/太大？**  
A: 修改 `web/src-tauri/tauri.conf.json` 中的 `width` 和 `height` 设置

## 许可证

MIT License 