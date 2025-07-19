import { useState, useEffect } from "react";
import "./App.css";

// API基础URL
const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [message, setMessage] = useState("");
  const [backendData, setBackendData] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 检查后端连接
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setIsConnected(true);
        return true;
      }
    } catch (error) {
      console.log("后端服务未启动:", error);
    }
    setIsConnected(false);
    return false;
  };

  // 获取后端数据
  const fetchDataFromBackend = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/hello`);
      if (response.ok) {
        const data = await response.json();
        setBackendData(data.message);
      } else {
        setBackendData("无法获取后端数据");
      }
    } catch (error) {
      console.error("获取数据失败:", error);
      setBackendData("连接后端失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 发送消息到后端
  const sendMessage = async () => {
    if (!message.trim() || !isConnected) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/echo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        const data = await response.json();
        setBackendData(data.echo);
      } else {
        setBackendData("发送失败");
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      setBackendData("无法连接到后端服务");
    } finally {
      setIsLoading(false);
    }
  };

  // 组件初始化
  useEffect(() => {
    const initApp = async () => {
      await checkBackendConnection();
    };
    
    initApp();
    
    // 定期检查连接状态
    const interval = setInterval(checkBackendConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-purple-700 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-xl flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🚀 Tauri + React + FastAPI 手脚架
          </h1>
          <div className={`px-4 py-2 rounded-full font-semibold text-sm border ${
            isConnected 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {isConnected ? '🟢 后端已连接' : '🔴 后端未连接'}
          </div>
        </div>

        {/* Warning */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6">
            ⚠️ 后端服务未启动。请运行: <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-sm">./start-dev.sh</code>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">👋 Hello World!</h2>
            <div className="mb-4 p-4 bg-blue-100 border-l-4 border-blue-500 rounded">
              <p className="text-blue-700 font-medium">🎨 Tailwind CSS v4 已成功加载！</p>
            </div>
            <p className="text-gray-600 mb-4">这是 TauriStack 现代化桌面应用开发手脚架，集成了：</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-lg">🖥️</span>
                <span><strong>Tauri</strong> - 高性能桌面应用框架</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">⚛️</span>
                <span><strong>React + TypeScript</strong> - 现代化前端</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">🐍</span>
                <span><strong>Python FastAPI</strong> - 高性能后端API</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">🔄</span>
                <span><strong>自动集成</strong> - 前后端自动启动和通信</span>
              </li>
            </ul>
          </div>

          {/* Demo Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6">🧪 API 测试</h3>
            
            <div className="space-y-4">
              <div>
                <button 
                  onClick={fetchDataFromBackend}
                  disabled={!isConnected || isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? "获取中..." : "📥 获取后端数据"}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="输入消息发送到后端..."
                  disabled={!isConnected}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected || !message.trim() || isLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
                >
                  {isLoading ? "发送中..." : "📤 发送"}
                </button>
              </div>

              {backendData && (
                <div className="bg-gray-50 rounded-xl p-4 border">
                  <h4 className="font-semibold text-gray-800 mb-2">📄 后端响应:</h4>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 font-mono text-sm text-gray-700">
                    {backendData}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6">📖 快速开始</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border">
                <h4 className="font-semibold text-gray-800 mb-2">🔧 开发模式</h4>
                <code className="block bg-gray-900 text-green-400 p-2 rounded font-mono text-sm">./start-dev.sh</code>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border">
                <h4 className="font-semibold text-gray-800 mb-2">📦 生产构建</h4>
                <code className="block bg-gray-900 text-green-400 p-2 rounded font-mono text-sm">./build-release.sh</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
