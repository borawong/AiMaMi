//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::commands::hotspot
//! Current role: Tauri command adapter
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::adapters::tauri::window;
use crate::application::BackendServices;
use tauri::{AppHandle, State};

#[tauri::command]
pub(crate) fn has_notch(services: State<'_, BackendServices>) -> Result<bool, String> {
    Ok(services.hotspot().state().supported)
}

#[tauri::command]
pub(crate) fn get_hotspot_enabled(services: State<'_, BackendServices>) -> Result<bool, String> {
    Ok(services.hotspot().state().enabled)
}

#[tauri::command]
pub(crate) fn set_hotspot_enabled(
    services: State<'_, BackendServices>,
    enabled: bool,
) -> Result<bool, String> {
    Ok(services.hotspot().set_enabled(enabled))
}

#[tauri::command]
pub(crate) fn focus_main_window(app: AppHandle) -> Result<(), String> {
    window::focus_main_window(&app)
}

#[tauri::command]
pub(crate) fn hotspot_ready(_app: AppHandle) -> Result<(), String> {
    Ok(())
}
