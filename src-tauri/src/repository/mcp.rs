use crate::contracts::{McpServerSummary, McpTransport};
use crate::core::error::CoreError;
use crate::repository::adapter::FileSystemAdapter;
use std::collections::HashMap;
use std::path::Path;

pub fn load_servers(
    fs: &dyn FileSystemAdapter,
    config_path: &Path,
) -> Result<Vec<McpServerSummary>, CoreError> {
    if !fs.exists(config_path) {
        return Ok(Vec::new());
    }

    let text = fs.read_to_string(config_path)?;
    let value: toml::Value = text.parse()?;
    let Some(servers_table) = value.get("mcp_servers").and_then(toml::Value::as_table) else {
        return Ok(Vec::new());
    };

    let mut servers = Vec::new();
    for (name, value) in servers_table {
        let Some(table) = value.as_table() else {
            continue;
        };
        let transport = table
            .get("transport")
            .and_then(toml::Value::as_str)
            .map(McpTransport::from_input)
            .unwrap_or(McpTransport::Stdio);
        let enabled = table
            .get("enabled")
            .and_then(toml::Value::as_bool)
            .unwrap_or(true);
        let command = table
            .get("command")
            .and_then(toml::Value::as_str)
            .map(ToString::to_string);
        let args = table
            .get("args")
            .and_then(toml::Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .filter_map(toml::Value::as_str)
                    .map(ToString::to_string)
                    .collect()
            })
            .unwrap_or_default();
        let url = table
            .get("url")
            .and_then(toml::Value::as_str)
            .map(ToString::to_string);
        let headers = read_string_table(table.get("headers"));
        let environment = read_string_table(table.get("env"));

        servers.push(McpServerSummary {
            name: name.clone(),
            transport,
            enabled,
            source_path: config_path.display().to_string(),
            command,
            args,
            url,
            headers,
            environment,
        });
    }

    servers.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    Ok(servers)
}

pub fn upsert_server(
    fs: &dyn FileSystemAdapter,
    config_path: &Path,
    server: &McpServerSummary,
) -> Result<McpServerSummary, CoreError> {
    let mut root = load_config_value(fs, config_path)?;
    ensure_table(&mut root);

    let root_table = root
        .as_table_mut()
        .ok_or_else(|| CoreError::InvalidInput("config.toml 根节点不是表".to_string()))?;
    let servers = root_table
        .entry("mcp_servers".to_string())
        .or_insert_with(|| toml::Value::Table(toml::map::Map::new()));
    let servers_table = servers
        .as_table_mut()
        .ok_or_else(|| CoreError::InvalidInput("mcp_servers 不是表".to_string()))?;

    servers_table.insert(server.name.clone(), render_server_table(server));
    save_config_value(fs, config_path, &root)?;
    let servers = load_servers(fs, config_path)?;
    servers
        .into_iter()
        .find(|item| item.name == server.name)
        .ok_or_else(|| CoreError::Operation("MCP 服务写入后未能重新读取".to_string()))
}

pub fn set_enabled(
    fs: &dyn FileSystemAdapter,
    config_path: &Path,
    name: &str,
    enabled: bool,
) -> Result<McpServerSummary, CoreError> {
    let mut server = load_servers(fs, config_path)?
        .into_iter()
        .find(|server| server.name == name)
        .ok_or_else(|| CoreError::NotFound(format!("MCP 服务不存在：{name}")))?;
    server.enabled = enabled;
    upsert_server(fs, config_path, &server)
}

pub fn remove_server(
    fs: &dyn FileSystemAdapter,
    config_path: &Path,
    name: &str,
) -> Result<(), CoreError> {
    let mut root = load_config_value(fs, config_path)?;
    let Some(root_table) = root.as_table_mut() else {
        return Ok(());
    };
    let Some(servers) = root_table.get_mut("mcp_servers") else {
        return Ok(());
    };
    let Some(servers_table) = servers.as_table_mut() else {
        return Ok(());
    };

    if servers_table.remove(name).is_none() {
        return Err(CoreError::NotFound(format!("MCP 服务不存在：{name}")));
    }

    save_config_value(fs, config_path, &root)
}

fn load_config_value(
    fs: &dyn FileSystemAdapter,
    config_path: &Path,
) -> Result<toml::Value, CoreError> {
    if !fs.exists(config_path) {
        return Ok(toml::Value::Table(toml::map::Map::new()));
    }
    let text = fs.read_to_string(config_path)?;
    if text.trim().is_empty() {
        return Ok(toml::Value::Table(toml::map::Map::new()));
    }
    Ok(text.parse()?)
}

fn save_config_value(
    fs: &dyn FileSystemAdapter,
    config_path: &Path,
    value: &toml::Value,
) -> Result<(), CoreError> {
    let text = toml::to_string_pretty(value)?;
    let tmp = config_path.with_extension("toml.tmp");
    fs.write_string(&tmp, &text)?;
    fs.rename(&tmp, config_path)
}

fn ensure_table(value: &mut toml::Value) {
    if value.as_table().is_none() {
        *value = toml::Value::Table(toml::map::Map::new());
    }
}

fn render_server_table(server: &McpServerSummary) -> toml::Value {
    let mut table = toml::map::Map::new();
    table.insert("enabled".to_string(), toml::Value::Boolean(server.enabled));
    table.insert(
        "transport".to_string(),
        toml::Value::String(server.transport.as_toml_value().to_string()),
    );

    if let Some(command) = non_empty(server.command.as_deref()) {
        table.insert(
            "command".to_string(),
            toml::Value::String(command.to_string()),
        );
    }
    if !server.args.is_empty() {
        table.insert(
            "args".to_string(),
            toml::Value::Array(
                server
                    .args
                    .iter()
                    .map(|item| toml::Value::String(item.clone()))
                    .collect(),
            ),
        );
    }
    if let Some(url) = non_empty(server.url.as_deref()) {
        table.insert("url".to_string(), toml::Value::String(url.to_string()));
    }
    if !server.headers.is_empty() {
        table.insert("headers".to_string(), render_string_table(&server.headers));
    }
    if !server.environment.is_empty() {
        table.insert("env".to_string(), render_string_table(&server.environment));
    }

    toml::Value::Table(table)
}

fn render_string_table(values: &HashMap<String, String>) -> toml::Value {
    let mut table = toml::map::Map::new();
    for (key, value) in values {
        table.insert(key.clone(), toml::Value::String(value.clone()));
    }
    toml::Value::Table(table)
}

fn read_string_table(value: Option<&toml::Value>) -> HashMap<String, String> {
    value
        .and_then(toml::Value::as_table)
        .map(|table| {
            table
                .iter()
                .filter_map(|(key, value)| {
                    value.as_str().map(|value| (key.clone(), value.to_string()))
                })
                .collect()
        })
        .unwrap_or_default()
}

fn non_empty(value: Option<&str>) -> Option<&str> {
    value.map(str::trim).filter(|value| !value.is_empty())
}
