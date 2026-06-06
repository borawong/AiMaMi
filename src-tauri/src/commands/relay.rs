use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{CoreEnvelope, RelayActionPayload};
use serde_json::Value;
use tauri::State;

#[tauri::command]
pub(crate) fn load_relay_state(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(state.services().relay().load_state())
}

#[tauri::command]
pub(crate) fn upsert_relay_provider(
    state: State<'_, TauriAppState>,
    input: Option<Value>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(state.services().relay().upsert_provider(input))
}

#[tauri::command]
pub(crate) fn delete_relay_provider(
    state: State<'_, TauriAppState>,
    provider_id: String,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .provider_action("delete_relay_provider", provider_id, None),
    )
}

#[tauri::command]
pub(crate) fn activate_relay_provider(
    state: State<'_, TauriAppState>,
    provider_id: String,
    ide: Option<String>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .provider_action("activate_relay_provider", provider_id, ide),
    )
}

#[tauri::command]
pub(crate) fn deactivate_relay_provider(
    state: State<'_, TauriAppState>,
    provider_id: String,
    ide: Option<String>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .provider_action("deactivate_relay_provider", provider_id, ide),
    )
}

#[tauri::command]
pub(crate) fn set_relay_provider_network(
    state: State<'_, TauriAppState>,
    provider_id: String,
    network: Option<String>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .set_provider_network(provider_id, network),
    )
}

#[tauri::command]
pub(crate) fn test_relay_provider(
    state: State<'_, TauriAppState>,
    provider_id: String,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .provider_action("test_relay_provider", provider_id, None),
    )
}

#[tauri::command]
pub(crate) fn test_relay_draft(
    state: State<'_, TauriAppState>,
    input: Option<Value>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .test_draft("test_relay_draft", input),
    )
}

#[tauri::command]
pub(crate) fn fetch_relay_models_draft(
    state: State<'_, TauriAppState>,
    input: Option<Value>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .test_draft("fetch_relay_models_draft", input),
    )
}

#[tauri::command]
pub(crate) fn get_relay_active(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(state.services().relay().empty_action("get_relay_active"))
}

#[tauri::command]
pub(crate) fn get_relay_proxy_status(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .empty_action("get_relay_proxy_status"),
    )
}

#[tauri::command]
pub(crate) fn set_codex_router_enabled(
    state: State<'_, TauriAppState>,
    enabled: bool,
    relaunch: Option<bool>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .set_router_enabled(enabled, relaunch),
    )
}

#[tauri::command]
pub(crate) fn export_relay_config(
    state: State<'_, TauriAppState>,
    file_path: String,
    include_api_keys: Option<bool>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .export_config(file_path, include_api_keys),
    )
}

#[tauri::command]
pub(crate) fn import_relay_config(
    state: State<'_, TauriAppState>,
    file_path: String,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(state.services().relay().import_config(file_path))
}

#[tauri::command]
pub(crate) fn set_block_official_passthrough(
    state: State<'_, TauriAppState>,
    blocked: bool,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .set_block_official_passthrough(blocked),
    )
}

#[tauri::command]
pub(crate) fn get_passthrough_audit_log(
    state: State<'_, TauriAppState>,
    limit: Option<i64>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(state.services().relay().audit_log(limit))
}

#[tauri::command]
pub(crate) fn diagnose_codex_router(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .empty_action("diagnose_codex_router"),
    )
}

#[tauri::command]
pub(crate) fn run_codex_router_diagnostics(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(
        state
            .services()
            .relay()
            .empty_action("run_codex_router_diagnostics"),
    )
}

#[tauri::command]
pub(crate) fn fix_codex_router_issue(
    state: State<'_, TauriAppState>,
    item_id: String,
) -> Result<CoreEnvelope<RelayActionPayload>, String> {
    respond(state.services().relay().fix_router_issue(item_id))
}
