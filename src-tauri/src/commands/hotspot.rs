use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::CoreEnvelope;
use serde_json::Value;
use tauri::State;

#[tauri::command]
pub(crate) fn has_notch(state: State<'_, TauriAppState>) -> Result<CoreEnvelope<bool>, String> {
    respond(state.services().system().has_notch())
}

#[tauri::command]
pub(crate) fn get_hotspot_enabled(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<bool>, String> {
    respond(state.services().system().get_hotspot_enabled())
}

#[tauri::command]
pub(crate) fn set_hotspot_enabled(
    state: State<'_, TauriAppState>,
    enabled: bool,
) -> Result<CoreEnvelope<bool>, String> {
    respond(state.services().system().set_hotspot_enabled(enabled))
}

#[tauri::command]
pub(crate) fn focus_main_window(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().focus_main_window())
}

#[tauri::command]
pub(crate) fn hotspot_ready(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().system().hotspot_ready())
}
