use crate::adapters::tauri::state::TauriAppState;
use crate::application::usecase::mcp::McpUpsertInput;
use crate::commands::respond;
use crate::contracts::{
    CoreEnvelope, McpServerListPayload, McpServerMutationPayload, McpServerRemovePayload,
};
use serde_json::Value;
use std::collections::HashMap;
use tauri::State;

#[tauri::command]
pub(crate) fn load_mcp_servers(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<McpServerListPayload>, String> {
    respond(state.services().mcp().load_servers())
}

#[tauri::command]
pub(crate) fn upsert_mcp_server(
    state: State<'_, TauriAppState>,
    name: String,
    config: Option<Value>,
    transport: Option<String>,
    enabled: Option<bool>,
    command: Option<String>,
    args: Option<Vec<String>>,
    url: Option<String>,
    headers: Option<HashMap<String, String>>,
    environment: Option<HashMap<String, String>>,
) -> Result<CoreEnvelope<McpServerMutationPayload>, String> {
    respond(state.services().mcp().upsert_server(McpUpsertInput {
        name,
        config,
        transport,
        enabled,
        command,
        args,
        url,
        headers,
        environment,
    }))
}

#[tauri::command]
pub(crate) fn set_mcp_server_enabled(
    state: State<'_, TauriAppState>,
    name: String,
    enabled: bool,
) -> Result<CoreEnvelope<McpServerMutationPayload>, String> {
    respond(state.services().mcp().set_server_enabled(name, enabled))
}

#[tauri::command]
pub(crate) fn remove_mcp_server(
    state: State<'_, TauriAppState>,
    name: String,
) -> Result<CoreEnvelope<McpServerRemovePayload>, String> {
    respond(state.services().mcp().remove_server(name))
}
