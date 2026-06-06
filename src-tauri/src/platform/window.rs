use crate::application::ports::WindowPort;
use crate::core::error::CoreError;
use tauri::Manager;

pub(crate) struct TauriWindow {
    app: tauri::AppHandle,
}

impl TauriWindow {
    pub(crate) fn new(app: tauri::AppHandle) -> Self {
        Self { app }
    }
}

impl WindowPort for TauriWindow {
    fn focus_main_window(&self) -> Result<(), CoreError> {
        focus_main_window(&self.app)
    }
}

#[derive(Default)]
pub(crate) struct NoopWindow;

impl WindowPort for NoopWindow {
    fn focus_main_window(&self) -> Result<(), CoreError> {
        Ok(())
    }
}

pub(crate) fn install_close_to_hide(app: &mut tauri::App) {
    if let Some(window) = app.get_webview_window("main") {
        let close_target = window.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = close_target.hide();
            }
        });
    }
}

pub(crate) fn focus_main_window(app: &tauri::AppHandle) -> Result<(), CoreError> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    Ok(())
}
