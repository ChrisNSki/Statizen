// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // Use the lib.rs run function which has all the monitor commands and overlay functions
  app_lib::run();
}
