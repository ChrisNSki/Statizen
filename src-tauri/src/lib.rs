use serde::Serialize;
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

#[derive(Serialize)]
struct MonitorInfo {
    id: usize,
    name: Option<String>,          // \\.\DISPLAYx
    friendly: Option<String>,      // e.g., "Dell U3824DW"
    x: i32, y: i32,
    width: u32, height: u32,
    scale: f64,
    primary: bool,
    key: String,
}

fn mk_key(m: &tauri::Monitor) -> String {
    let p = m.position(); 
    let s = m.size();
    format!("{}:{}:{}x{}@{:.2}", p.x, p.y, s.width, s.height, m.scale_factor())
}

#[cfg(windows)]
fn windows_monitor_friendly_names() -> Result<std::collections::HashMap<usize, String>, String> {
    use regex::Regex;
    use serde::Deserialize;
    use wmi::{COMLibrary, WMIConnection};

    #[derive(Deserialize)]
    struct WmiMonitorID {
        #[serde(rename="InstanceName")] instance_name: String,
        #[serde(rename="UserFriendlyName")] user_friendly_name: Vec<u16>,
        #[serde(rename="Active")] active: bool,
    }

    let com = COMLibrary::new().map_err(|e| e.to_string())?;
    // IMPORTANT: namespace
    let wmi = WMIConnection::with_namespace_path("ROOT\\WMI", com.into())
        .map_err(|e| e.to_string())?;

    // Filter to active monitors, reduces dupes
    let rows: Vec<WmiMonitorID> = wmi
        .raw_query("SELECT InstanceName, UserFriendlyName, Active FROM WmiMonitorID WHERE Active = True")
        .map_err(|e| e.to_string())?;

    println!("🔍 WMI query returned {} active monitors", rows.len());
    for (i, row) in rows.iter().enumerate() {
        println!("  Monitor {}: InstanceName='{}', Active={}", i, row.instance_name, row.active);
    }

    let re = Regex::new(r"DISPLAY(\d+)").unwrap();
    let mut map = std::collections::HashMap::new();

    for r in rows {
        if let Some(caps) = re.captures(&r.instance_name) {
            if let Ok(idx1) = caps[1].parse::<usize>() {
                let idx0 = idx1.saturating_sub(1);
                let name_u16: Vec<u16> = r.user_friendly_name.into_iter().take_while(|&c| c != 0).collect();
                let friendly = String::from_utf16_lossy(&name_u16).trim().to_string();
                println!("  🖥️ Monitor {}: friendly='{}' (from WMI)", idx0, friendly);
                if !friendly.is_empty() {
                    map.insert(idx0, friendly);
                }
            }
        }
    }
    Ok(map)
}

#[cfg(not(windows))]
fn windows_monitor_friendly_names() -> Result<std::collections::HashMap<usize, String>, String> {
    Ok(Default::default())
}

#[tauri::command]
fn list_monitors(app: tauri::AppHandle) -> Result<Vec<MonitorInfo>, String> {
    let mons = app.available_monitors().map_err(|e| e.to_string())?;
    let primary = app.primary_monitor().ok().flatten();
    let primary_pos = primary.as_ref().map(|m| m.position());

    // Try to get friendly names on Windows
    let friendly_map = windows_monitor_friendly_names().unwrap_or_default();

    Ok(mons.iter().enumerate().map(|(i, m)| {
        let pos = m.position(); 
        let size = m.size();
        MonitorInfo {
            id: i,
            name: m.name().cloned(),                               // \\.\DISPLAYx
            friendly: friendly_map.get(&i).cloned(),               // "LG UltraWide", etc
            x: pos.x, y: pos.y,
            width: size.width, height: size.height,
            scale: m.scale_factor(),
            primary: primary_pos.map(|p| p.x == pos.x && p.y == pos.y).unwrap_or(false),
            key: mk_key(m),
        }
    }).collect())
}

#[tauri::command]
fn bind_window_to_monitor(
    app: tauri::AppHandle,
    label: String,
    monitor_idx: usize,
    capture_input: bool
) -> Result<(), String> {
    let w: WebviewWindow = app.get_webview_window(&label).ok_or("window not found")?;
    let mons = app.available_monitors().map_err(|e| e.to_string())?;
    let m = mons.get(monitor_idx).ok_or("bad monitor idx")?;
    let pos = m.position(); 
    let size = m.size();
    w.set_size(PhysicalSize::new(size.width, size.height)).map_err(|e| e.to_string())?;
    w.set_position(PhysicalPosition::new(pos.x, pos.y)).map_err(|e| e.to_string())?;
    w.set_ignore_cursor_events(!capture_input).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn minimize_window(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_config_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().into_owned())
}

#[tauri::command]
fn set_passthrough(win: tauri::WebviewWindow, pass: bool) -> tauri::Result<()> {
    println!("🔧 Rust: Setting passthrough to: {}", pass);
    win.set_ignore_cursor_events(pass)?;
    println!("✅ Rust: Passthrough set successfully to: {}", pass);
    Ok(())
}

#[tauri::command]
fn enable_overlay_interaction(win: tauri::WebviewWindow) -> tauri::Result<()> {
    println!("🔧 Rust: Enabling overlay interaction");
    win.set_focus()?;
    // Force disable cursor event ignoring
    win.set_ignore_cursor_events(false)?;
    println!("✅ Rust: Overlay interaction enabled - cursor events should work now");
    Ok(())
}

#[tauri::command]
fn disable_overlay_interaction(win: tauri::WebviewWindow) -> tauri::Result<()> {
    println!("🔧 Rust: Disabling overlay interaction");
    win.set_ignore_cursor_events(true)?;
    println!("✅ Rust: Overlay interaction disabled - clicks will pass through");
    Ok(())
}

#[tauri::command]
fn position_overlay_window(app: tauri::AppHandle, monitor_id: usize) -> tauri::Result<()> {
    let overlay = app.get_webview_window("overlay").ok_or_else(|| {
        println!("❌ Error: Overlay window not found when trying to position it");
        tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "Overlay window not found"))
    })?;
    
    let monitors = app.available_monitors().map_err(|e| tauri::Error::from(e))?;
    let monitor = monitors.get(monitor_id).ok_or_else(|| {
        println!("❌ Error: Invalid monitor ID: {}", monitor_id);
        tauri::Error::from(std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid monitor ID"))
    })?;

    // Position overlay to cover the entire monitor
    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    
    // Set overlay to full screen on the target monitor
    let overlay_width = monitor_size.width;
    let overlay_height = monitor_size.height;
    
    // Position at the monitor's origin (top-left corner)
    let overlay_x = monitor_pos.x;
    let overlay_y = monitor_pos.y;
    
    println!("🔧 Positioning overlay on monitor {}: {}x{} at ({}, {})", monitor_id, overlay_width, overlay_height, overlay_x, overlay_y);
    
    overlay.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(overlay_width, overlay_height)))?;
    overlay.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(overlay_x, overlay_y)))?;
    // Note: passthrough state is now managed by the JavaScript side via set_passthrough command
    
    println!("✅ Overlay positioned successfully");
    Ok(())
}

#[tauri::command]
fn destroy_overlay_window(app: tauri::AppHandle) -> tauri::Result<()> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay.close()?;
    }
    Ok(())
}

#[tauri::command]
fn show_overlay_window(app: tauri::AppHandle) -> tauri::Result<()> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay.show()?;
        overlay.set_focus()?;
        println!("🔧 Debug: Overlay window shown and focused");
    } else {
        println!("❌ Error: Overlay window not found when trying to show it");
    }
    Ok(())
}

#[tauri::command]
fn hide_overlay_window(app: tauri::AppHandle) -> tauri::Result<()> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay.hide()?;
    }
    Ok(())
}

#[tauri::command]
fn broadcast_to_overlay(app: tauri::AppHandle, message: serde_json::Value) -> tauri::Result<()> {
    println!("🔧 Rust: Broadcasting to overlay: {:?}", message);
    if let Some(overlay) = app.get_webview_window("overlay") {
        // Check the message type and emit the appropriate event
        if let Some(msg_type) = message.get("type").and_then(|v| v.as_str()) {
            match msg_type {
                "toggle-edit-mode" => {
                    println!("🔧 Rust: Emitting toggle-edit-mode event to overlay");
                    overlay.emit("toggle-edit-mode", message)?;
                }
                "settings-update" => {
                    println!("🔧 Rust: Emitting settings-update event to overlay");
                    overlay.emit("settings-update", message)?;
                }
                _ => {
                    println!("🔧 Rust: Emitting default settings-update event to overlay");
                    overlay.emit("settings-update", message)?;
                }
            }
        } else {
            println!("🔧 Rust: No message type found, emitting settings-update event to overlay");
            overlay.emit("settings-update", message)?;
        }
        println!("✅ Rust: Event emitted successfully to overlay");
    } else {
        println!("❌ Rust: Overlay window not found");
    }
    Ok(())
}

#[tauri::command]
fn broadcast_to_main(app: tauri::AppHandle, message: serde_json::Value) -> tauri::Result<()> {
    if let Some(main) = app.get_webview_window("main") {
        main.emit("edit-mode-state", message)?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            list_monitors,
            bind_window_to_monitor,
            minimize_window,
            get_config_dir,
            set_passthrough,
            enable_overlay_interaction,
            disable_overlay_interaction,
            position_overlay_window,
            destroy_overlay_window,
            show_overlay_window,
            hide_overlay_window,
            broadcast_to_overlay,
            broadcast_to_main
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Set up cleanup for overlay window when main window closes
            if let Some(main_window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        println!("🔧 Main window closing, cleaning up overlay...");
                        if let Some(overlay) = app_handle.get_webview_window("overlay") {
                            if let Err(e) = overlay.close() {
                                println!("❌ Failed to close overlay window: {}", e);
                            } else {
                                println!("✅ Overlay window closed successfully");
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}