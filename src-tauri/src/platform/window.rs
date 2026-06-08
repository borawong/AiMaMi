use crate::application::ports::AppWindowPort;
use crate::core::error::CoreError;
use tauri::{AppHandle, Manager};

// Tauri 窗口适配器只在 platform 边界持有 AppHandle。
pub(crate) struct TauriWindowPort<'a> {
    app: &'a AppHandle,
}

impl<'a> TauriWindowPort<'a> {
    pub(crate) fn new(app: &'a AppHandle) -> Self {
        Self { app }
    }
}

impl AppWindowPort for TauriWindowPort<'_> {
    fn focus_main_window(&self) -> Result<(), CoreError> {
        focus_main_window(self.app)
    }
}

fn focus_main_window(app: &AppHandle) -> Result<(), CoreError> {
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
