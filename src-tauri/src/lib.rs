use std::env;











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
