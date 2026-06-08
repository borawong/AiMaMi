use crate::application::usecase;
use crate::contracts::{
    CoreEnvelope, RuntimeExtensionConfigPayload, RuntimeExtensionListPayload,
    RuntimeExtensionSettingsValue, RuntimeExtensionTogglePayload,
};
use crate::repository::Repository;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn list_plugins(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<RuntimeExtensionListPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::runtime_extensions::list(&repo)))
}

#[tauri::command]
pub fn toggle_plugin(
    repo: State<'_, Mutex<Repository>>,
    id: String,
    enabled: bool,
) -> Result<CoreEnvelope<RuntimeExtensionTogglePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::runtime_extensions::toggle(
        &repo, id, enabled,
    )))
}

#[tauri::command]
pub fn get_plugin_config(
    repo: State<'_, Mutex<Repository>>,
    id: String,
) -> Result<CoreEnvelope<RuntimeExtensionConfigPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::runtime_extensions::config(
        &repo, id, None,
    )))
}

#[tauri::command]
pub fn update_plugin_config(
    repo: State<'_, Mutex<Repository>>,
    id: String,
    settings: RuntimeExtensionSettingsValue,
) -> Result<CoreEnvelope<RuntimeExtensionConfigPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::runtime_extensions::config(
        &repo,
        id,
        Some(settings),
    )))
}
