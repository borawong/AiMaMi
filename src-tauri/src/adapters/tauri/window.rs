//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::window
//! Current role: Tauri command adapter
//! Future integration point: replace this stub through the declared port/use-case boundary.

use tauri::Manager;

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

pub(crate) fn focus_main_window(app: &tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    Ok(())
}
