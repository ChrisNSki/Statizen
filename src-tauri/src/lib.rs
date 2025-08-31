use std::process::Command;
use std::env;
use std::os::windows::process::CommandExt;





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





// Get app data directory for installer warnings
#[tauri::command]
async fn get_app_data_dir() -> Result<String, String> {
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    Ok(app_data)
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
            get_app_data_dir,
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
