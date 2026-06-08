use crate::application::service::{current_timestamp, restored_status};
use crate::contracts::{
    BackendEffect, McpServerConfigInput, McpServerListPayload, McpServerMutationPayload,
    McpServerRemovePayload, McpServerSummary, McpTransport,
};
use crate::core::error::CoreError;
use crate::repository::{mcp, Repository};
use std::collections::HashMap;

pub fn load_servers(repo: &Repository) -> Result<McpServerListPayload, CoreError> {
    let items = mcp::load_servers(repo.fs(), &repo.paths().config_path)?;
    Ok(McpServerListPayload {
        status: restored_status("mcp", "load_mcp_servers", BackendEffect::NoOp),
        total: items.len() as i32,
        source_path: repo.paths().config_path.display().to_string(),
        last_scan_at: current_timestamp(),
        items,
    })
}

#[allow(clippy::too_many_arguments)]
pub fn upsert_server(
    repo: &Repository,
    name: String,
    transport: String,
    enabled: Option<bool>,
    config: Option<McpServerConfigInput>,
    command: Option<String>,
    args: Vec<String>,
    url: Option<String>,
    headers: HashMap<String, String>,
    environment: HashMap<String, String>,
) -> Result<McpServerMutationPayload, CoreError> {
    let input_name = config
        .as_ref()
        .and_then(|config| config.name.clone())
        .unwrap_or(name);
    validate_name(&input_name)?;

    let transport = config
        .as_ref()
        .and_then(|config| config.transport.clone())
        .unwrap_or(transport);
    let server = McpServerSummary {
        name: input_name,
        transport: McpTransport::from_input(&transport),
        enabled: config
            .as_ref()
            .and_then(|config| config.enabled)
            .or(enabled)
            .unwrap_or(true),
        source_path: repo.paths().config_path.display().to_string(),
        command: config
            .as_ref()
            .and_then(|config| config.command.clone())
            .or(command),
        args: if let Some(config) = config.as_ref().filter(|config| !config.args.is_empty()) {
            config.args.clone()
        } else {
            args
        },
        url: config
            .as_ref()
            .and_then(|config| config.url.clone())
            .or(url),
        headers: if let Some(config) = config.as_ref().filter(|config| !config.headers.is_empty()) {
            config.headers.clone()
        } else {
            headers
        },
        environment: if let Some(config) = config
            .as_ref()
            .filter(|config| !config.environment.is_empty())
        {
            config.environment.clone()
        } else {
            environment
        },
    };

    let saved = mcp::upsert_server(repo.fs(), &repo.paths().config_path, &server)?;
    let all = mcp::load_servers(repo.fs(), &repo.paths().config_path)?;
    Ok(McpServerMutationPayload {
        status: restored_status("mcp", "upsert_mcp_server", BackendEffect::NoOp),
        server: saved,
        total: all.len() as i32,
        source_path: repo.paths().config_path.display().to_string(),
    })
}

pub fn set_enabled(
    repo: &Repository,
    name: String,
    enabled: bool,
) -> Result<McpServerMutationPayload, CoreError> {
    validate_name(&name)?;
    let saved = mcp::set_enabled(repo.fs(), &repo.paths().config_path, &name, enabled)?;
    let all = mcp::load_servers(repo.fs(), &repo.paths().config_path)?;
    Ok(McpServerMutationPayload {
        status: restored_status("mcp", "set_mcp_server_enabled", BackendEffect::NoOp),
        server: saved,
        total: all.len() as i32,
        source_path: repo.paths().config_path.display().to_string(),
    })
}

pub fn remove_server(repo: &Repository, name: String) -> Result<McpServerRemovePayload, CoreError> {
    validate_name(&name)?;
    mcp::remove_server(repo.fs(), &repo.paths().config_path, &name)?;
    let all = mcp::load_servers(repo.fs(), &repo.paths().config_path)?;
    Ok(McpServerRemovePayload {
        status: restored_status("mcp", "remove_mcp_server", BackendEffect::NoOp),
        removed_name: name,
        total: all.len() as i32,
        source_path: repo.paths().config_path.display().to_string(),
    })
}

fn validate_name(name: &str) -> Result<(), CoreError> {
    if name.trim().is_empty() {
        return Err(CoreError::InvalidInput("MCP 服务名称不能为空".to_string()));
    }
    Ok(())
}
