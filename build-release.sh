#!/bin/bash

echo "📦 翻译助手 - 一键打包脚本"
echo "============================"
echo "🎯 目标: 打包出可直接双击使用的桌面应用"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 错误处理函数
handle_error() {
    echo -e "${RED}❌ 错误: $1${NC}"
    exit 1
}

# 成功信息函数
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 警告信息函数
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 信息函数
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查必要工具
check_dependencies() {
    info "检查构建依赖..."
    
    if ! command -v python3 &> /dev/null; then
        handle_error "Python3 未安装"
    fi
    
    if ! command -v npm &> /dev/null; then
        handle_error "npm 未安装"
    fi
    
    if ! command -v cargo &> /dev/null; then
        handle_error "Rust/Cargo 未安装，Tauri 需要 Rust"
    fi
    
    success "所有依赖检查通过"
}

# 清理之前的构建
clean_builds() {
    info "清理之前的构建文件..."
    
    # 清理后端构建
    if [ -d "backend/dist" ]; then
        rm -rf backend/dist
        echo "  删除: backend/dist"
    fi
    
    if [ -d "backend/build" ]; then
        rm -rf backend/build
        echo "  删除: backend/build"
    fi
    
    # 清理前端构建
    if [ -d "web/src-tauri/target/release" ]; then
    rm -rf web/src-tauri/target/release
    echo "  删除: web/src-tauri/target/release"
    fi
    
    success "构建文件清理完成"
}

# 构建后端
build_backend() {
    info "📦 构建 Python 后端..."
    
    cd backend
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        info "创建 Python 虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装依赖
    info "安装 Python 依赖..."
    pip install -r requirements.txt || handle_error "Python 依赖安装失败"
    
    # 使用 PyInstaller 构建
    info "使用 PyInstaller 构建可执行文件..."
    python build.py || handle_error "后端构建失败"
    
    cd ..
    
    success "✅ 后端构建完成 - backend/dist/translate_backend"
}

# 构建完整应用
build_app() {
    info "🎯 构建完整的翻译助手应用..."
    
    cd web
    
    # 安装前端依赖
    if [ ! -d "node_modules" ]; then
        info "安装前端依赖..."
        npm install || handle_error "前端依赖安装失败"
    fi
    
    # 构建 Tauri 应用 (会自动调用后端构建)
    info "构建 Tauri 桌面应用..."
    npm run tauri build || handle_error "应用构建失败"
    
    cd ..
    
    success "✅ 翻译助手应用构建完成!"
}

# 显示应用位置
show_app_location() {
    info "🔍 查找构建好的应用..."
    
    local bundle_dir="web/src-tauri/target/release/bundle"
    
    if [ -d "$bundle_dir" ]; then
        echo ""
        success "🎉 翻译助手应用构建成功!"
        echo ""
        echo "📱 应用位置:"
        
        # macOS
        if [ -d "$bundle_dir/macos" ]; then
            echo "  🍎 macOS 应用: $bundle_dir/macos/"
            find "$bundle_dir/macos" -name "*.app" -type d | while read app; do
                local app_size=$(du -sh "$app" | cut -f1)
                echo "     📦 $(basename "$app") ($app_size)"
                echo "     🎯 双击即可使用: $app"
            done
        fi
        
        # DMG 安装包
        if [ -d "$bundle_dir/dmg" ]; then
            echo "  💿 DMG 安装包: $bundle_dir/dmg/"
            find "$bundle_dir/dmg" -name "*.dmg" | while read dmg; do
                local dmg_size=$(du -sh "$dmg" | cut -f1)
                echo "     📦 $(basename "$dmg") ($dmg_size)"
            done
        fi
        
        # Windows
        if [ -d "$bundle_dir/msi" ]; then
            echo "  🪟 Windows 安装包: $bundle_dir/msi/"
        fi
        
        echo ""
        echo "✨ 使用说明:"
        echo "  1. 找到对应平台的应用文件"
        echo "  2. 双击即可运行 (会自动启动后端服务)"
        echo "  3. 应用关闭时会自动停止后端服务"
        
    else
        warning "未找到构建好的应用"
    fi
}

# 主构建流程
main() {
    echo "⏰ 开始时间: $(date)"
    echo ""
    
    # 检查项目结构
    if [ ! -d "backend" ] || [ ! -d "web" ]; then
        handle_error "请在项目根目录运行此脚本"
    fi
    
    # 执行构建步骤
    check_dependencies
    echo ""
    
    clean_builds
    echo ""
    
    build_app
    echo ""
    
    show_app_location
    
    echo ""
    echo "⏰ 构建完成时间: $(date)"
    success "🎉 翻译助手打包完成! 现在可以直接双击使用了!"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --no-clean)
            NO_CLEAN=true
            shift
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo ""
            echo "🎯 功能: 一键打包翻译助手桌面应用"
            echo ""
            echo "选项:"
            echo "  --backend-only  仅构建后端可执行文件"
            echo "  --no-clean      不清理之前的构建"
            echo "  -h, --help      显示帮助信息"
            echo ""
            echo "输出:"
            echo "  📱 可直接双击使用的桌面应用"
            echo "  🍎 macOS: .app 文件"
            echo "  🪟 Windows: .exe 安装包"
            echo "  🐧 Linux: AppImage 或 DEB 包"
            exit 0
            ;;
        *)
            handle_error "未知选项: $1"
            ;;
    esac
done

# 根据参数执行对应的构建
if [ "$BACKEND_ONLY" = true ]; then
    info "📦 仅构建后端可执行文件..."
    check_dependencies
    [ "$NO_CLEAN" != true ] && clean_builds
    build_backend
    echo ""
    if [ -f "backend/dist/translate_backend" ]; then
        BACKEND_SIZE=$(du -h backend/dist/translate_backend | cut -f1)
        success "✅ 后端构建完成: backend/dist/translate_backend ($BACKEND_SIZE)"
    fi
else
    # 完整构建
    main
fi 