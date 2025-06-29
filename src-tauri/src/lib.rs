use std::process::Command;
use tauri::async_runtime::spawn_blocking;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn generate_image(prompt: String) -> Result<String, String> {
    let result = spawn_blocking(move || {
        let output = Command::new("python3")
            .arg("inference.py")
            .arg("image") // Funktion spezifizieren
            .arg(&prompt)
            .output()
            .map_err(|e| format!("Failed to execute Python script: {}", e))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Python script failed: {}", error_msg));
        }

        let filename = String::from_utf8(output.stdout)
            .map_err(|e| format!("Failed to parse output: {}", e))?
            .trim()
            .to_string();

        if filename.is_empty() {
            return Err("No filename returned from Python script".to_string());
        }

        Ok(filename)
    })
    .await;

    // Handle the result from the background thread
    result.unwrap_or_else(|e| Err(format!("Thread join error: {}", e)))
}

#[tauri::command]
async fn generate_audio(text: String, speaker: String, language: String) -> Result<String, String> {
    let result = spawn_blocking(move || {
        let output = Command::new("python3")
            .arg("inference.py")
            .arg("audio") // Funktion spezifizieren
            .arg(&text)
            .arg(&speaker)
            .arg(&language)
            .output()
            .map_err(|e| format!("Failed to execute Python script: {}", e))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Python script failed: {}", error_msg));
        }

        let filename = String::from_utf8(output.stdout)
            .map_err(|e| format!("Failed to parse output: {}", e))?
            .trim()
            .to_string();

        if filename.is_empty() {
            return Err("No filename returned from Python script".to_string());
        }

        Ok(filename)
    })
    .await;

    // Handle the result from the background thread
    result.unwrap_or_else(|e| Err(format!("Thread join error: {}", e)))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            generate_image,
            generate_audio
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
