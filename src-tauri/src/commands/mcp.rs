use crate::core::auth::current_timestamp;
use crate::core::mcp;
use crate::core::models::*;
use crate::core::repository::Repository;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn load_mcp_servers(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<McpServerListPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let items = mcp::load_mcp_servers(&paths.config_path).map_err(|e| e.to_string())?;
    let payload = McpServerListPayload {
        total: items.len() as i32,
        source_path: paths.config_path.display().to_string(),
        last_scan_at: current_timestamp(),
        items,
    };
    let _ = repo.store_bootstrap_mcp_servers(&payload);
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn upsert_mcp_server(
    repo: State<'_, Mutex<Repository>>,
    name: String,
    transport: String,
    enabled: bool,
    command: Option<String>,
    args: Vec<String>,
    url: Option<String>,
    headers: HashMap<String, String>,
    environment: HashMap<String, String>,
) -> Result<CoreEnvelope<McpServerMutationPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let transport_enum = match transport.as_str() {
        "stdio" => McpTransport::Stdio,
        "http" => McpTransport::Http,
        "sse" => McpTransport::Sse,
        _ => McpTransport::Unknown,
    };
    let server = McpServerSummary {
        name,
        transport: transport_enum,
        enabled,
        source_path: paths.config_path.display().to_string(),
        command,
        args,
        url,
        headers,
        environment,
    };
    let saved = mcp::upsert_mcp_server(&paths.config_path, &server).map_err(|e| e.to_string())?;
    let all = mcp::load_mcp_servers(&paths.config_path).map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(McpServerMutationPayload {
        server: saved,
        total: all.len() as i32,
        source_path: paths.config_path.display().to_string(),
    }))
}

#[tauri::command]
pub fn set_mcp_server_enabled(
    repo: State<'_, Mutex<Repository>>,
    name: String,
    enabled: bool,
) -> Result<CoreEnvelope<McpServerMutationPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let saved = mcp::set_mcp_server_enabled(&paths.config_path, &name, enabled)
        .map_err(|e| e.to_string())?;
    let all = mcp::load_mcp_servers(&paths.config_path).map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(McpServerMutationPayload {
        server: saved,
        total: all.len() as i32,
        source_path: paths.config_path.display().to_string(),
    }))
}

#[tauri::command]
pub fn remove_mcp_server(
    repo: State<'_, Mutex<Repository>>,
    name: String,
) -> Result<CoreEnvelope<McpServerRemovePayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    mcp::remove_mcp_server(&paths.config_path, &name).map_err(|e| e.to_string())?;
    let all = mcp::load_mcp_servers(&paths.config_path).map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(McpServerRemovePayload {
        removed_name: name,
        total: all.len() as i32,
        source_path: paths.config_path.display().to_string(),
    }))
}
