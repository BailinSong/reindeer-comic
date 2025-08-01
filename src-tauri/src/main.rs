// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::path::PathBuf;
use std::fs;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn read_zip_files(path: String) -> Result<Vec<String>, String> {
    let file = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    let mut files = Vec::new();
    for i in 0..archive.len() {
        let file = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = file.name().to_string();
        if is_image_file(&name) {
            files.push(name);
        }
    }
    
    files.sort();
    Ok(files)
}

#[tauri::command]
async fn read_image_from_zip(zip_path: String, image_path: String) -> Result<String, String> {
    use std::io::Read;
    use base64::{Engine as _, engine::general_purpose};
    
    let file = std::fs::File::open(&zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    let mut zip_file = archive.by_name(&image_path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    zip_file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
    
    // Convert to base64 for use in img src
    let base64_data = general_purpose::STANDARD.encode(&buffer);
    let mime_type = get_mime_type(&image_path);
    Ok(format!("data:{};base64,{}", mime_type, base64_data))
}

fn get_mime_type(filename: &str) -> &'static str {
    if let Some(ext) = filename.split('.').last() {
        match ext.to_lowercase().as_str() {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "bmp" => "image/bmp",
            _ => "image/png"
        }
    } else {
        "image/png"
    }
}

#[tauri::command]
async fn read_directory_files(path: String) -> Result<Vec<String>, String> {
    let dir_path = PathBuf::from(&path);
    if !dir_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut files = Vec::new();
    for entry in fs::read_dir(dir_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if is_image_file(name) {
                    files.push(path.to_string_lossy().to_string());
                }
            }
        }
    }
    
    files.sort();
    Ok(files)
}

fn is_image_file(filename: &str) -> bool {
    let extensions = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];
    if let Some(ext) = filename.split('.').last() {
        extensions.contains(&ext.to_lowercase().as_str())
    } else {
        false
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, read_zip_files, read_image_from_zip, read_directory_files])
        .setup(|app| {
            // Enable file drop for all windows
            let window = app.get_window("main").unwrap();
            window.listen("tauri://file-drop", |event| {
                println!("File dropped: {:?}", event.payload());
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}