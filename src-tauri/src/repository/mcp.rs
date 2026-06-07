use crate::contracts::{McpServerSummary, McpTransport};
use crate::core::error::CoreError;
use crate::core::parser;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use serde_json::{Map as JsonMap, Value as JsonValue};
use std::collections::HashMap;
use std::sync::Arc;
use toml::{Table as TomlTable, Value as TomlValue};

#[derive(Clone)]
pub(crate) struct McpRepository {
    fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl McpRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { fs, paths }
    }

    pub(crate) fn source_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::McpSource)
    }

    pub(crate) fn list_servers(&self) -> Result<Vec<McpServerSummary>, CoreError> {
        let path = self.paths.resolve(RepositoryPath::McpSource);
        if !self.fs.exists(&path) {
            return Ok(Vec::new());
        }

        let content = self.fs.read_to_string(&path)?;
        parse_mcp_servers(&content, self.source_path())
    }
}

fn parse_mcp_servers(
    content: &str,
    source_path: String,
) -> Result<Vec<McpServerSummary>, CoreError> {
    let content = content.trim();
    if content.is_empty() {
        return Ok(Vec::new());
    }

    if looks_like_json(content) {
        match serde_json::from_str::<JsonValue>(content) {
            Ok(value) => return parse_json_payload(&value, &source_path),
            Err(json_error) => {
                return match toml::from_str::<TomlValue>(content) {
                    Ok(value) => parse_toml_payload(&value, &source_path),
                    Err(toml_error) => Err(parse_error(format!(
                        "json: {}; toml: {}",
                        json_error, toml_error
                    ))),
                };
            }
        }
    }

    let value = toml::from_str::<TomlValue>(content).map_err(toml_parse_error)?;
    parse_toml_payload(&value, &source_path)
}

fn parse_json_payload(
    value: &JsonValue,
    source_path: &str,
) -> Result<Vec<McpServerSummary>, CoreError> {
    if value.is_array() {
        return parse_json_collection(value, source_path);
    }

    let object = value
        .as_object()
        .ok_or_else(|| format_error("mcp json payload must be an object or array"))?;

    if let Some(items) = object.get("items") {
        return parse_json_collection(items, source_path);
    }

    let mut found_collection = false;
    let mut servers = Vec::new();
    for key in ["mcpServers", "mcp_servers"] {
        if let Some(value) = object.get(key) {
            found_collection = true;
            servers.extend(parse_json_collection(value, source_path)?);
        }
    }
    if found_collection {
        return Ok(servers);
    }

    if is_json_server_object(object) {
        return parse_json_server(value, None, source_path).map(|server| vec![server]);
    }

    Err(format_error("mcp json payload missing server collection"))
}

fn parse_json_collection(
    value: &JsonValue,
    source_path: &str,
) -> Result<Vec<McpServerSummary>, CoreError> {
    if let Some(items) = value.as_array() {
        return items
            .iter()
            .map(|item| parse_json_server(item, None, source_path))
            .collect();
    }

    let object = value
        .as_object()
        .ok_or_else(|| format_error("mcp json server collection must be array or object"))?;

    if is_json_server_object(object) {
        return parse_json_server(value, None, source_path).map(|server| vec![server]);
    }

    object
        .iter()
        .map(|(name, item)| parse_json_server(item, Some(name.as_str()), source_path))
        .collect()
}

fn parse_json_server(
    value: &JsonValue,
    name_hint: Option<&str>,
    source_path: &str,
) -> Result<McpServerSummary, CoreError> {
    let object = value
        .as_object()
        .ok_or_else(|| format_error("mcp json server item must be an object"))?;
    let command = json_string(object, &["command"]);
    let url = json_string(object, &["url"]);

    Ok(McpServerSummary {
        name: json_string(object, &["name"])
            .or_else(|| non_empty_text(name_hint))
            .unwrap_or_default(),
        transport: json_transport(object),
        enabled: json_bool(object, &["enabled"]).unwrap_or(true),
        source_path: source_path.to_owned(),
        command,
        args: json_string_list(object, &["args"]),
        url,
        headers: json_string_map(object, &["headers"]),
        environment: json_string_map(object, &["environment", "env"]),
    })
}

fn parse_toml_payload(
    value: &TomlValue,
    source_path: &str,
) -> Result<Vec<McpServerSummary>, CoreError> {
    let table = value
        .as_table()
        .ok_or_else(|| format_error("mcp toml payload must be a table"))?;

    let mut found_collection = false;
    let mut servers = Vec::new();
    for key in ["mcpServers", "mcp_servers"] {
        if let Some(value) = table.get(key) {
            found_collection = true;
            servers.extend(parse_toml_collection(value, source_path)?);
        }
    }
    if found_collection {
        return Ok(servers);
    }

    if is_toml_server_table(table) {
        return parse_toml_server(value, None, source_path).map(|server| vec![server]);
    }

    Err(format_error("mcp toml payload missing server blocks"))
}

fn parse_toml_collection(
    value: &TomlValue,
    source_path: &str,
) -> Result<Vec<McpServerSummary>, CoreError> {
    if let Some(items) = value.as_array() {
        return items
            .iter()
            .map(|item| parse_toml_server(item, None, source_path))
            .collect();
    }

    let table = value
        .as_table()
        .ok_or_else(|| format_error("mcp toml server collection must be table or array"))?;

    if is_toml_server_table(table) {
        return parse_toml_server(value, None, source_path).map(|server| vec![server]);
    }

    table
        .iter()
        .map(|(name, item)| parse_toml_server(item, Some(name.as_str()), source_path))
        .collect()
}

fn parse_toml_server(
    value: &TomlValue,
    name_hint: Option<&str>,
    source_path: &str,
) -> Result<McpServerSummary, CoreError> {
    let table = value
        .as_table()
        .ok_or_else(|| format_error("mcp toml server item must be a table"))?;
    let command = toml_string(table, &["command"]);
    let url = toml_string(table, &["url"]);

    Ok(McpServerSummary {
        name: toml_string(table, &["name"])
            .or_else(|| non_empty_text(name_hint))
            .unwrap_or_default(),
        transport: toml_transport(table),
        enabled: toml_bool(table, &["enabled"]).unwrap_or(true),
        source_path: source_path.to_owned(),
        command,
        args: toml_string_list(table, &["args"]),
        url,
        headers: toml_string_map(table, &["headers"]),
        environment: toml_string_map(table, &["environment", "env"]),
    })
}

fn json_transport(object: &JsonMap<String, JsonValue>) -> McpTransport {
    json_string(object, &["transport"])
        .as_deref()
        .map(parse_transport)
        .unwrap_or(McpTransport::Unknown)
}

fn toml_transport(table: &TomlTable) -> McpTransport {
    toml_string(table, &["transport"])
        .as_deref()
        .map(parse_transport)
        .unwrap_or(McpTransport::Unknown)
}

fn parse_transport(value: &str) -> McpTransport {
    parser::parse_mcp_transport(&value.trim().to_ascii_lowercase())
}

fn json_string(object: &JsonMap<String, JsonValue>, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| object.get(*key).and_then(json_value_string))
}

fn toml_string(table: &TomlTable, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| table.get(*key).and_then(toml_value_string))
}

fn json_bool(object: &JsonMap<String, JsonValue>, keys: &[&str]) -> Option<bool> {
    keys.iter()
        .find_map(|key| object.get(*key).and_then(JsonValue::as_bool))
}

fn toml_bool(table: &TomlTable, keys: &[&str]) -> Option<bool> {
    keys.iter()
        .find_map(|key| table.get(*key).and_then(TomlValue::as_bool))
}

fn json_string_list(object: &JsonMap<String, JsonValue>, keys: &[&str]) -> Vec<String> {
    keys.iter()
        .find_map(|key| object.get(*key).map(json_value_list))
        .unwrap_or_default()
}

fn toml_string_list(table: &TomlTable, keys: &[&str]) -> Vec<String> {
    keys.iter()
        .find_map(|key| table.get(*key).map(toml_value_list))
        .unwrap_or_default()
}

fn json_string_map(object: &JsonMap<String, JsonValue>, keys: &[&str]) -> HashMap<String, String> {
    keys.iter()
        .find_map(|key| {
            object
                .get(*key)
                .and_then(JsonValue::as_object)
                .map(json_map_values)
        })
        .unwrap_or_default()
}

fn toml_string_map(table: &TomlTable, keys: &[&str]) -> HashMap<String, String> {
    keys.iter()
        .find_map(|key| {
            table
                .get(*key)
                .and_then(TomlValue::as_table)
                .map(toml_map_values)
        })
        .unwrap_or_default()
}

fn json_value_string(value: &JsonValue) -> Option<String> {
    value
        .as_str()
        .and_then(|value| non_empty_text(Some(value.as_ref())))
}

fn toml_value_string(value: &TomlValue) -> Option<String> {
    value
        .as_str()
        .and_then(|value| non_empty_text(Some(value.as_ref())))
}

fn json_value_list(value: &JsonValue) -> Vec<String> {
    match value {
        JsonValue::Array(items) => items.iter().filter_map(json_scalar_string).collect(),
        _ => json_scalar_string(value).into_iter().collect(),
    }
}

fn toml_value_list(value: &TomlValue) -> Vec<String> {
    match value {
        TomlValue::Array(items) => items.iter().filter_map(toml_scalar_string).collect(),
        _ => toml_scalar_string(value).into_iter().collect(),
    }
}

fn json_map_values(object: &JsonMap<String, JsonValue>) -> HashMap<String, String> {
    object
        .iter()
        .filter_map(|(key, value)| json_scalar_string(value).map(|value| (key.clone(), value)))
        .collect()
}

fn toml_map_values(table: &TomlTable) -> HashMap<String, String> {
    table
        .iter()
        .filter_map(|(key, value)| toml_scalar_string(value).map(|value| (key.clone(), value)))
        .collect()
}

fn json_scalar_string(value: &JsonValue) -> Option<String> {
    match value {
        JsonValue::String(value) => non_empty_text(Some(value.as_ref())),
        JsonValue::Bool(_) | JsonValue::Number(_) => Some(value.to_string()),
        _ => None,
    }
}

fn toml_scalar_string(value: &TomlValue) -> Option<String> {
    match value {
        TomlValue::String(value) => non_empty_text(Some(value.as_ref())),
        TomlValue::Integer(_)
        | TomlValue::Float(_)
        | TomlValue::Boolean(_)
        | TomlValue::Datetime(_) => Some(value.to_string()),
        _ => None,
    }
}

fn non_empty_text(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

fn is_json_server_object(object: &JsonMap<String, JsonValue>) -> bool {
    SERVER_KEYS.iter().any(|key| object.contains_key(*key))
}

fn is_toml_server_table(table: &TomlTable) -> bool {
    SERVER_KEYS.iter().any(|key| table.contains_key(*key))
}

fn looks_like_json(content: &str) -> bool {
    content.starts_with('{') || content.starts_with('[')
}

fn toml_parse_error(error: toml::de::Error) -> CoreError {
    parse_error(error.to_string())
}

fn parse_error(diagnostic: impl Into<String>) -> CoreError {
    CoreError::repository("mcp_servers_parse_failed", "MCP 服务列表解析失败。")
        .with_diagnostic(diagnostic.into())
}

fn format_error(diagnostic: impl Into<String>) -> CoreError {
    CoreError::repository("mcp_servers_parse_failed", "MCP 服务列表格式不正确。")
        .with_diagnostic(diagnostic.into())
}

const SERVER_KEYS: &[&str] = &[
    "name",
    "transport",
    "command",
    "args",
    "url",
    "headers",
    "environment",
    "env",
    "enabled",
];
