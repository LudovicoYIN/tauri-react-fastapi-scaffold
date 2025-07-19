# TauriStack Desktop Application Development Scaffold

Modern desktop application development scaffold based on Tauri + React + FastAPI tech stack.

[English](./README_EN.md) | [中文](./README.md)

## ✨ Features

- 🚀 **High Performance** - Tauri provides small bundle size and fast runtime
- 🔄 **Hot Reload** - Frontend supports hot reload for smooth development experience
- 🐍 **Python Backend** - Use familiar Python ecosystem
- 📦 **One-Click Build** - Automatically package as cross-platform desktop application
- 🎨 **Modern UI** - Tailwind CSS v4 + React components
- 🔧 **Ready to Use** - Pre-configured development and build environment

## Tech Stack

- **Desktop App**: Tauri (Rust)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Python + FastAPI
- **Communication**: Local RESTful API

## Requirements

### 1. Install Rust

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# Visit https://rustup.rs/ to download installer

# Verify installation after restarting terminal
rustc --version
cargo --version
```

### 2. Install Node.js

- Download and install [Node.js](https://nodejs.org/) (Recommended version 20)

### 3. Install Python

- Download and install [Python](https://python.org/) (3.8+)

## Quick Start

### Development Mode

```bash
# Clone project
git clone <project-url>
cd <project-name>

# Start development environment (auto install dependencies and start frontend/backend)
chmod +x start-dev.sh
./start-dev.sh
```

### Development Services

After successful startup, the following services will be running:

- **Frontend App**: http://localhost:1420 (Tauri window)
- **Backend API**: http://127.0.0.1:8000 
- **API Docs**: http://127.0.0.1:8000/docs (Swagger UI)

**Stop Services**: Press `Ctrl+C` in terminal to stop all services

### Production Build

```bash
# One-click build distributable desktop application
chmod +x build-release.sh
./build-release.sh
```

After build completion, executable files are located at:
- **macOS**: `web/src-tauri/target/release/bundle/macos/`
- **Windows**: `web/src-tauri/target/release/bundle/msi/`
- **Linux**: `web/src-tauri/target/release/bundle/deb/`

## Project Structure

```
.
├── web/                    # Frontend project (React + Tauri)
│   ├── src/               # React components
│   ├── src-tauri/         # Tauri configuration and Rust code
│   └── package.json       # Frontend dependencies
├── backend/               # Backend project (Python FastAPI)
│   ├── app/              # API routes
│   ├── build.py          # Backend packaging script
│   └── requirements.txt   # Python dependencies
├── start-dev.sh          # Development environment startup script
└── build-release.sh      # Production build script
```

## Development Guide

### Adding New API Endpoints

1. Add new routes in `backend/app/api.py`:
   ```python
   @router.get("/api/v1/new-endpoint")
   async def new_endpoint():
       return {"message": "New endpoint"}
   ```
2. Frontend usage example:
   ```typescript
   const response = await fetch('http://127.0.0.1:8000/api/v1/new-endpoint');
   const data = await response.json();
   ```

### Modifying Frontend Interface

1. Edit React components in `web/src/`
2. Use Tailwind CSS v4 for styling:
   ```tsx
   <div className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg">
     Button
   </div>
   ```
3. Supports hot reload, changes take effect on save

### Custom Application Configuration

Edit `web/src-tauri/tauri.conf.json` to modify:
- **App Info**: `productName`, `version`
- **Window Settings**: `width`, `height`, `resizable`
- **Icon Path**: `icon` array
- **Permission Control**: `allowlist` configuration

### Development Tips

- **View Logs**: Open browser developer tools to view frontend logs
- **Debug API**: Visit http://127.0.0.1:8000/docs to test endpoints
- **Restart Backend**: If backend code changes don't take effect, press `Ctrl+C` to stop and restart
- **Clear Cache**: Delete `web/node_modules` and `backend/venv` to reinstall

## FAQ

**Q: Development environment fails to start?**  
A: Check if Rust, Node.js, Python are correctly installed, run corresponding `--version` commands to verify

**Q: Build fails?**  
A: Ensure all dependencies are installed, check terminal error messages, try deleting cache and reinstalling

**Q: How to modify application icon?**  
A: Replace icon files in `web/src-tauri/icons/` directory, supports `.png` and `.ico` formats

**Q: Frontend changes not taking effect?**  
A: Check terminal for errors, try refreshing browser or restarting development server

**Q: Backend API inaccessible?**  
A: Confirm backend service is running (port 8000), check firewall settings

**Q: How to add new dependencies?**  
A: 
- Frontend: Run `npm install package-name` in `web/` directory
- Backend: Activate virtual environment in `backend/` directory then run `pip install package-name`, and update `requirements.txt`

**Q: Application window too small/large?**  
A: Modify `width` and `height` settings in `web/src-tauri/tauri.conf.json`

## License

MIT License 