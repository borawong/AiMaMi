use crate::core::error::CoreError;
use tauri::Manager;

pub fn focus_main_window(app: &tauri::AppHandle) -> Result<(), CoreError> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .show()
            .map_err(|error| CoreError::Operation(error.to_string()))?;
        window
            .set_focus()
            .map_err(|error| CoreError::Operation(error.to_string()))?;
    }
    Ok(())
}
