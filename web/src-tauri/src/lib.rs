use std::process::{Command, Child, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::Manager;

// 后端进程管理
struct BackendProcess {
    child: Option<Child>,
}

impl BackendProcess {
    fn new() -> Self {
        Self { child: None }
    }
    
    fn start(&mut self, app_handle: Option<&tauri::AppHandle>) -> Result<(), String> {
        // 寻找后端可执行文件
        let mut backend_paths = vec![
            "./translate_backend".to_string(),
            "./backend/dist/translate_backend".to_string(),
            "../backend/dist/translate_backend".to_string(),
        ];
        
        // 如果是打包后的应用，使用 Tauri 的资源路径
        if let Some(handle) = app_handle {
            if let Ok(resource_path) = handle.path().resource_dir() {
                // 尝试多个可能的文件名
                let possible_names = vec![
                    "translate_backend",
                    "translate_backend.exe",
                ];
                
                for name in possible_names {
                    let backend_in_resources = resource_path.join(name);
                    backend_paths.insert(0, backend_in_resources.to_string_lossy().to_string());
                }
            }
        }
        
        // 添加 Windows 版本
        let mut all_paths = backend_paths.clone();
        for path in &backend_paths {
            if !path.ends_with(".exe") {
                all_paths.push(format!("{}.exe", path));
            }
        }
        
        let mut backend_path = None;
        for path in all_paths {
            if std::path::Path::new(&path).exists() {
                backend_path = Some(path);
                break;
            }
        }
        
        if let Some(path) = backend_path {
            println!("Starting backend from: {}", path);
            
            // 在 Unix 系统上确保文件有执行权限
            #[cfg(unix)]
            {
                use std::fs;
                use std::os::unix::fs::PermissionsExt;
                
                if let Ok(metadata) = fs::metadata(&path) {
                    let mut perms = metadata.permissions();
                    perms.set_mode(perms.mode() | 0o755);
                    let _ = fs::set_permissions(&path, perms);
                }
            }
            
            let child = Command::new(&path)
                .stdout(Stdio::null())  // 隐藏输出
                .stderr(Stdio::null())  // 隐藏错误输出
                .spawn()
                .map_err(|e| format!("Failed to start backend: {}", e))?;
                
            self.child = Some(child);
            
            // 等待后端启动
            thread::sleep(Duration::from_secs(2));
            
            // 检查后端是否正常启动
            self.check_backend_health().map_err(|_| {
                "Backend started but health check failed".to_string()
            })?;
            
            println!("Backend started successfully");
            Ok(())
        } else {
            Err("Backend executable not found".to_string())
        }
    }
    
    fn check_backend_health(&self) -> Result<(), String> {
        // 简单的健康检查
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let client = reqwest::Client::new();
            let response = client
                .get("http://127.0.0.1:8000/health")
                .send()
                .await;
            
            match response {
                Ok(resp) if resp.status().is_success() => Ok(()),
                _ => Err("Health check failed".to_string()),
            }
        })
    }
    
    fn stop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
            println!("Backend stopped");
        }
    }
}

impl Drop for BackendProcess {
    fn drop(&mut self) {
        self.stop();
    }
}

// Tauri 命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn check_backend_status() -> Result<String, String> {
    let client = reqwest::Client::new();
    match client.get("http://127.0.0.1:8000/health").send().await {
        Ok(response) if response.status().is_success() => {
            Ok("Backend is running".to_string())
        }
        _ => Err("Backend is not responding".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let backend_process = Arc::new(Mutex::new(BackendProcess::new()));
    let backend_clone = backend_process.clone();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            // 启动后端服务
            let backend = backend_clone.clone();
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                let mut process = backend.lock().unwrap();
                if let Err(e) = process.start(Some(&app_handle)) {
                    eprintln!("Failed to start backend: {}", e);
                    // 不阻止应用启动，让用户知道需要手动启动后端
                }
            });
            Ok(())
        })
        .on_window_event(move |_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // 应用关闭时停止后端
                let mut process = backend_process.lock().unwrap();
                process.stop();
            }
        })
        .invoke_handler(tauri::generate_handler![greet, check_backend_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
