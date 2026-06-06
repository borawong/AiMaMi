use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{
    CoreEnvelope, RuntimeExtensionConfigPayload, RuntimeExtensionListPayload,
    RuntimeExtensionSettingsValue, RuntimeExtensionTogglePayload,
};
use tauri::State;

#[tauri::command]
pub(crate) fn list_plugins(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<RuntimeExtensionListPayload>, String> {
    respond(state.services().runtime_extensions().list_plugins())
}

#[tauri::command]
pub(crate) fn toggle_plugin(
    state: State<'_, TauriAppState>,
    id: String,
    enabled: bool,
) -> Result<CoreEnvelope<RuntimeExtensionTogglePayload>, String> {
    respond(
        state
            .services()
            .runtime_extensions()
            .toggle_plugin(id, enabled),
    )
}

#[tauri::command]
pub(crate) fn get_plugin_config(
    state: State<'_, TauriAppState>,
    id: String,
) -> Result<CoreEnvelope<RuntimeExtensionConfigPayload>, String> {
    respond(state.services().runtime_extensions().get_plugin_config(id))
}

#[tauri::command]
pub(crate) fn update_plugin_config(
    state: State<'_, TauriAppState>,
    id: String,
    settings: Option<RuntimeExtensionSettingsValue>,
) -> Result<CoreEnvelope<RuntimeExtensionConfigPayload>, String> {
    respond(
        state
            .services()
            .runtime_extensions()
            .update_plugin_config(id, settings),
    )
}
