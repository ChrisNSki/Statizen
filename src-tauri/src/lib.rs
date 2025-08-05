use std::process::Command;
use std::env;
use std::os::windows::process::CommandExt;
use std::fs;

// Simple logging function
fn log_to_file(message: &str) {
    let app_data = env::var("APPDATA").unwrap_or_else(|_| "C:\\Users\\Public".to_string());
    let statizen_dir = format!("{}\\statizen", app_data);
    let log_file = format!("{}\\startup_debug.log", statizen_dir);
    
    // Create directory if it doesn't exist
    if let Some(parent) = std::path::Path::new(&log_file).parent() {
        let _ = fs::create_dir_all(parent);
    }
    
    // Simple timestamp using std::time
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let log_entry = format!("[{}] {}\n", now, message);
    
    let _ = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)
        .and_then(|mut file| std::io::Write::write_all(&mut file, log_entry.as_bytes()));
}

// Get the installation directory and store it
fn get_installation_path() -> Result<String, String> {
    let exe_path = env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent().ok_or("Could not get executable directory")?;
    Ok(exe_dir.to_string_lossy().to_string())
}

// Store installation path to a file
fn store_installation_path() -> Result<(), String> {
    let install_path = get_installation_path()?;
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let statizen_dir = format!("{}\\statizen", app_data);
    let path_file = format!("{}\\install_path.txt", statizen_dir);
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&statizen_dir).map_err(|e| e.to_string())?;
    
    // Write installation path
    fs::write(&path_file, install_path).map_err(|e| e.to_string())?;
    
    Ok(())
}

// Get stored installation path
fn get_stored_installation_path() -> Result<String, String> {
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let path_file = format!("{}\\statizen\\install_path.txt", app_data);
    
    if fs::metadata(&path_file).is_ok() {
        let content = fs::read_to_string(&path_file).map_err(|e| e.to_string())?;
        Ok(content.trim().to_string())
    } else {
        // Fallback to current executable path
        get_installation_path()
    }
}

#[tauri::command]
async fn check_process_running(process_name: String) -> Result<bool, String> {    
    let output = Command::new("tasklist")
        .arg("/FI")
        .arg(format!("IMAGENAME eq {}", process_name))
        .arg("/FO")
        .arg("CSV")
        .creation_flags(0x08000000) // CREATE_NO_WINDOW flag to prevent command prompt from showing
        .output()
        .map_err(|e| e.to_string())?;
    
    let output_str = String::from_utf8_lossy(&output.stdout);
    let is_running = output_str.contains(&process_name);
    
    Ok(is_running)
}

// Check if auto-startup is enabled (Task Scheduler or startup folder)
#[tauri::command]
async fn check_auto_startup() -> Result<bool, String> {
    // Check Task Scheduler first
    let task_output = Command::new("schtasks")
        .args(&["/query", "/tn", "Statizen", "/fo", "csv"])
        .creation_flags(0x08000000)
        .output();
    
    if let Ok(output) = task_output {
        if output.status.success() {
            return Ok(true);
        }
    }
    
    // Check startup folder as fallback
    let startup_path = format!("{}\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Statizen.lnk", 
        env::var("APPDATA").map_err(|e| e.to_string())?);
    
    let startup_exists = std::path::Path::new(&startup_path).exists();
    
    Ok(startup_exists)
}

// Enable auto-startup using Task Scheduler (preferred method)
#[tauri::command]
async fn enable_auto_startup() -> Result<String, String> {
    log_to_file("=== Starting auto-startup enable process ===");
    
    // Store installation path first
    store_installation_path()?;
    
    let install_path = get_stored_installation_path()?;
    let app_path = format!("{}\\Statizen.exe", install_path);
    
    // Get the current username
    let username = env::var("USERNAME").unwrap_or_else(|_| "Administrator".to_string());
    
    log_to_file(&format!("Installation path: {}", install_path));
    log_to_file(&format!("App path: {}", app_path));
    log_to_file(&format!("Username: {}", username));
    
    // Check if the executable exists
    if !std::path::Path::new(&app_path).exists() {
        log_to_file(&format!("ERROR: Executable not found at: {}", app_path));
        return Err("Executable not found".to_string());
    }
    
    // Try Task Scheduler first
    let task_args = vec![
        "/create", "/tn", "Statizen", "/tr", &app_path,
        "/sc", "onlogon", "/ru", &username, "/f"
    ];
    
    log_to_file(&format!("Running schtasks with args: {:?}", task_args));
    
    let task_output = Command::new("schtasks")
        .args(&task_args)
        .creation_flags(0x08000000)
        .output();
    
    match task_output {
        Ok(output) => {
            log_to_file(&format!("Task Scheduler exit code: {}", output.status));
            log_to_file(&format!("Task Scheduler stdout: {}", String::from_utf8_lossy(&output.stdout)));
            log_to_file(&format!("Task Scheduler stderr: {}", String::from_utf8_lossy(&output.stderr)));
            
            if output.status.success() {
                log_to_file("SUCCESS: Task Scheduler task created successfully");
                return Ok("task_scheduler".to_string());
            } else {
                log_to_file(&format!("ERROR: Task Scheduler failed with exit code: {}", output.status));
                return Err("task_scheduler_failed".to_string());
            }
        }
        Err(e) => {
            log_to_file(&format!("ERROR: Failed to execute schtasks command: {}", e));
            return Err("task_scheduler_failed".to_string());
        }
    }
}

// Disable auto-startup
#[tauri::command]
async fn disable_auto_startup() -> Result<(), String> {
    // Remove from Task Scheduler
    let _task_output = Command::new("schtasks")
        .args(&["/delete", "/tn", "Statizen", "/f"])
        .creation_flags(0x08000000)
        .output();
    
    // Remove from startup folder
    let startup_path = format!("{}\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Statizen.lnk", 
        env::var("APPDATA").map_err(|e| e.to_string())?);
    
    if std::path::Path::new(&startup_path).exists() {
        std::fs::remove_file(&startup_path).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// Create startup folder shortcut (fallback method)
#[tauri::command]
async fn create_startup_shortcut() -> Result<String, String> {
    let install_path = get_stored_installation_path()?;
    let app_path = format!("{}\\Statizen.exe", install_path);
    
    let startup_folder = format!("{}\\Microsoft\\Windows\\Start Menu\\Programs\\Startup", 
        env::var("APPDATA").map_err(|e| e.to_string())?);
    
    let shortcut_path = format!("{}\\Statizen.lnk", startup_folder);
    
    // Create shortcut using PowerShell
    let ps_script = format!(
        "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('{}'); $Shortcut.TargetPath = '{}'; $Shortcut.Save()",
        shortcut_path, app_path
    );
    
    let output = Command::new("powershell")
        .args(&["-Command", &ps_script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;
    
    if !output.status.success() {
        return Err("Failed to create startup shortcut".to_string());
    }
    
    Ok("startup_folder".to_string())
}

// Store installation path on app startup
#[tauri::command]
async fn store_app_path() -> Result<(), String> {
    store_installation_path()
}

// Check if Task Scheduler is available
#[tauri::command]
async fn check_task_scheduler_available() -> Result<bool, String> {
    let output = Command::new("schtasks")
        .args(&["/query", "/fo", "csv"])
        .creation_flags(0x08000000)
        .output();
    
    Ok(output.is_ok())
}

// Check if startup folder is available
#[tauri::command]
async fn check_startup_folder_available() -> Result<bool, String> {
    let startup_folder = format!("{}\\Microsoft\\Windows\\Start Menu\\Programs\\Startup", 
        env::var("APPDATA").map_err(|e| e.to_string())?);
    
    Ok(std::path::Path::new(&startup_folder).exists())
}

#[tauri::command]
async fn minimize_window() -> Result<(), String> {
    // This will be handled by the window API
    Ok(())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            check_process_running, 
            check_auto_startup, 
            enable_auto_startup, 
            disable_auto_startup,
            create_startup_shortcut,
            check_task_scheduler_available,
            check_startup_folder_available,
            store_app_path,
            minimize_window
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
