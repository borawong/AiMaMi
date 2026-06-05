//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::commands::mcp
//! Current role: Tauri command adapter
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::application::mcp::McpUpsertInput;
use crate::application::BackendServices;
use crate::contracts::{
    CoreEnvelope, McpServerListPayload, McpServerMutationPayload, McpServerRemovePayload,
};
use serde_json::Value;
use std::collections::HashMap;
use tauri::State;

#[tauri::command]
pub(crate) fn load_mcp_servers(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<McpServerListPayload>, String> {
    Ok(services.mcp().load_servers())
}

#[tauri::command]
pub(crate) fn upsert_mcp_server(
    services: State<'_, BackendServices>,
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
    Ok(services.mcp().upsert_server(McpUpsertInput {
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
    services: State<'_, BackendServices>,
    name: String,
    enabled: bool,
) -> Result<CoreEnvelope<McpServerMutationPayload>, String> {
    Ok(services.mcp().set_server_enabled(name, enabled))
}

#[tauri::command]
pub(crate) fn remove_mcp_server(
    services: State<'_, BackendServices>,
    name: String,
) -> Result<CoreEnvelope<McpServerRemovePayload>, String> {
    Ok(services.mcp().remove_server(name))
}
