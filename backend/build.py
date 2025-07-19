#!/usr/bin/env python3
"""
PyInstaller 构建脚本
用于将FastAPI应用打包成独立的可执行文件
包含环境准备、依赖安装和构建流程
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def setup_environment():
    """设置构建环境"""
    print("🔧 准备构建环境...")
    
    # 检查并创建虚拟环境
    if not os.path.exists("venv"):
        print("📦 创建 Python 虚拟环境...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
    
    # 激活虚拟环境并安装依赖
    print("📋 安装构建依赖...")
    
    # 确定虚拟环境的 Python 路径
    if sys.platform == "win32":
        venv_python = "venv\\Scripts\\python.exe"
        venv_pip = "venv\\Scripts\\pip.exe"
    else:
        venv_python = "venv/bin/python"
        venv_pip = "venv/bin/pip"
    
    # 安装依赖
    subprocess.run([venv_pip, "install", "-r", "requirements.txt"], check=True)
    
    return venv_python

def clean_build():
    """清理之前的构建文件"""
    print("🧹 清理构建文件...")
    
    dirs_to_clean = ["build", "dist", "__pycache__"]
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
            print(f"   删除: {dir_name}")
    
    # 删除spec文件
    spec_files = list(Path(".").glob("*.spec"))
    for spec_file in spec_files:
        spec_file.unlink()
        print(f"   删除: {spec_file}")

def build_executable_with_venv(pyinstaller_path):
    """使用虚拟环境中的PyInstaller构建可执行文件"""
    print("📦 开始构建可执行文件...")
    
    # PyInstaller命令参数
    cmd = [
        pyinstaller_path,
        "--onefile",                    # 打包成单个文件
        "--name=translate_backend",     # 可执行文件名
        "--distpath=dist",              # 输出目录
        "--workpath=build",             # 临时文件目录
        "--clean",                      # 清理临时文件
        "--add-data=app:app",           # 添加app目录
        "app/main.py"                   # 入口文件
    ]
    
    # 只在 Windows 上使用 windowed 模式
    if sys.platform == "win32":
        cmd.append("--windowed")
    
    # macOS 特定参数（移除 universal2 以避免架构兼容性问题）
    if sys.platform == "darwin":
        pass  # 使用默认架构
    
    print(f"执行命令: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("✅ 构建成功!")
        print(result.stdout)
        
        # 显示输出文件信息
        dist_dir = Path("dist")
        if dist_dir.exists():
            exe_files = list(dist_dir.glob("*"))
            print(f"\n📁 输出文件位于: {dist_dir.absolute()}")
            for exe_file in exe_files:
                size_mb = exe_file.stat().st_size / (1024 * 1024)
                print(f"   📄 {exe_file.name} ({size_mb:.1f} MB)")
        
    except subprocess.CalledProcessError as e:
        print("❌ 构建失败!")
        print(f"错误输出:\n{e.stderr}")
        return False
    
    return True

def create_spec_file():
    """创建自定义的spec文件"""
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['app/main.py'],
    pathex=[],
    binaries=[],
    datas=[('app', 'app')],
    hiddenimports=['uvicorn.lifespan.on', 'uvicorn.lifespan.off'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='translate_backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''
    
    with open("translate_backend.spec", "w", encoding="utf-8") as f:
        f.write(spec_content)
    
    print("📝 创建了自定义spec文件: translate_backend.spec")

def main():
    """主函数"""
    print("🚀 开始构建手脚架后端")
    print("=" * 50)
    
    try:
        # 设置构建环境
        venv_python = setup_environment()
        
        # 确定虚拟环境的工具路径
        if sys.platform == "win32":
            venv_pyinstaller = "venv\\Scripts\\pyinstaller.exe"
        else:
            venv_pyinstaller = "venv/bin/pyinstaller"
        
        # 检查虚拟环境中的PyInstaller
        print("🔍 检查 PyInstaller...")
        subprocess.run([venv_pyinstaller, "--version"], check=True, capture_output=True)
        
        # 清理构建文件
        clean_build()
        
        # 构建可执行文件（使用虚拟环境的PyInstaller）
        success = build_executable_with_venv(venv_pyinstaller)
        
        # 设置可执行权限
        if success and not sys.platform == "win32":
            dist_file = "dist/translate_backend"
            if os.path.exists(dist_file):
                os.chmod(dist_file, 0o755)
                print("✅ 设置可执行权限")
        
        if success:
            print("\n🎉 构建完成!")
            print("可执行文件位于 dist/ 目录中")
        else:
            print("\n💥 构建失败，请检查错误信息")
        
        return success
        
    except Exception as e:
        print(f"\n❌ 构建过程出错: {e}")
        return False

if __name__ == "__main__":
    main() 