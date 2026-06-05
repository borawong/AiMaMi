use crate::application::ports::WindowPort;
use crate::core::error::CoreError;
use tauri::Manager;

/// 中文职责说明：Tauri 窗口 adapter，只能位于 platform 层，command/usecase 不直接持有窗口对象。
pub(crate) struct TauriWindow<'a> {
    app: &'a tauri::AppHandle,
}

impl<'a> TauriWindow<'a> {
    pub(crate) fn new(app: &'a tauri::AppHandle) -> Self {
        Self { app }
    }
}

impl WindowPort for TauriWindow<'_> {
    fn focus_main_window(&self) -> Result<(), CoreError> {
        focus_main_window(self.app)
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
