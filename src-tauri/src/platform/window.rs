use crate::application::ports::WindowPort;
use crate::core::error::CoreError;
use tauri::Manager;

/// 中文职责说明：Tauri 窗口 adapter，只能位于 platform 层，command/usecase 不直接持有窗口对象。
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

/// 中文职责说明：无窗口运行场景的窗口端口占位，只表达端口边界，不执行 UI 副作用。
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
