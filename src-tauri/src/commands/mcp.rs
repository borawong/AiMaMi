use crate::application::usecase;
use crate::contracts::{
    CoreEnvelope, McpServerConfigInput, McpServerListPayload, McpServerMutationPayload,
    McpServerRemovePayload,
};
use crate::repository::Repository;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn load_mcp_servers(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<McpServerListPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::mcp::load_servers(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn upsert_mcp_server(
    repo: State<'_, Mutex<Repository>>,
    name: String,
    transport: String,
    enabled: Option<bool>,
    config: Option<McpServerConfigInput>,
    command: Option<String>,
    args: Vec<String>,
    url: Option<String>,
    headers: HashMap<String, String>,
    environment: HashMap<String, String>,
) -> Result<CoreEnvelope<McpServerMutationPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::mcp::upsert_server(
        &repo,
        name,
        transport,
        enabled,
        config,
        command,
        args,
        url,
        headers,
        environment,
    )
    .map(CoreEnvelope::ok)
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_mcp_server_enabled(
    repo: State<'_, Mutex<Repository>>,
    name: String,
    enabled: bool,
) -> Result<CoreEnvelope<McpServerMutationPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::mcp::set_enabled(&repo, name, enabled)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn remove_mcp_server(
    repo: State<'_, Mutex<Repository>>,
    name: String,
) -> Result<CoreEnvelope<McpServerRemovePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::mcp::remove_server(&repo, name)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}
