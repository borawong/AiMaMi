//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::mcp
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{
    stub_warning, CoreEnvelope, McpServerListPayload, McpServerMutationPayload,
    McpServerRemovePayload, McpServerSummary, McpTransport,
};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub(crate) struct McpUpsertInput {
    pub name: String,
    pub config: Option<Value>,
    pub transport: Option<String>,
    pub enabled: Option<bool>,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub url: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    pub environment: Option<HashMap<String, String>>,
}

#[derive(Default)]
pub(crate) struct McpService;

impl McpService {
    pub(crate) fn load_servers(&self) -> CoreEnvelope<McpServerListPayload> {
        CoreEnvelope::ok_with_warnings(McpServerListPayload::default(), vec![stub_warning("mcp")])
    }

    pub(crate) fn upsert_server(
        &self,
        input: McpUpsertInput,
    ) -> CoreEnvelope<McpServerMutationPayload> {
        let server = server_from_input(input);
        CoreEnvelope::no_op(
            McpServerMutationPayload {
                server,
                total: 0,
                source_path: String::new(),
            },
            "upsert_mcp_server",
        )
    }

    pub(crate) fn set_server_enabled(
        &self,
        name: String,
        enabled: bool,
    ) -> CoreEnvelope<McpServerMutationPayload> {
        CoreEnvelope::no_op(
            McpServerMutationPayload {
                server: McpServerSummary {
                    name,
                    enabled,
                    ..McpServerSummary::default()
                },
                total: 0,
                source_path: String::new(),
            },
            "set_mcp_server_enabled",
        )
    }

    pub(crate) fn remove_server(&self, name: String) -> CoreEnvelope<McpServerRemovePayload> {
        CoreEnvelope::no_op(
            McpServerRemovePayload {
                removed_name: name,
                total: 0,
                source_path: String::new(),
            },
            "remove_mcp_server",
        )
    }
}

fn server_from_input(input: McpUpsertInput) -> McpServerSummary {
    let config = input.config.as_ref();
    McpServerSummary {
        name: input.name,
        transport: input
            .transport
            .or_else(|| config_string(config, "transport"))
            .as_deref()
            .map(parse_transport)
            .unwrap_or_default(),
        enabled: input
            .enabled
            .or_else(|| config_bool(config, "enabled"))
            .unwrap_or(false),
        source_path: String::new(),
        command: input.command.or_else(|| config_string(config, "command")),
        args: input
            .args
            .or_else(|| config_string_vec(config, "args"))
            .unwrap_or_default(),
        url: input.url.or_else(|| config_string(config, "url")),
        headers: input
            .headers
            .or_else(|| config_string_map(config, "headers"))
            .unwrap_or_default(),
        environment: input
            .environment
            .or_else(|| config_string_map(config, "environment"))
            .unwrap_or_default(),
    }
}

fn parse_transport(value: &str) -> McpTransport {
    match value {
        "stdio" => McpTransport::Stdio,
        "http" => McpTransport::Http,
        "sse" => McpTransport::Sse,
        _ => McpTransport::Unknown,
    }
}

fn config_string(config: Option<&Value>, key: &str) -> Option<String> {
    config?.get(key)?.as_str().map(ToOwned::to_owned)
}

fn config_bool(config: Option<&Value>, key: &str) -> Option<bool> {
    config?.get(key)?.as_bool()
}

fn config_string_vec(config: Option<&Value>, key: &str) -> Option<Vec<String>> {
    let values = config?.get(key)?.as_array()?;
    Some(
        values
            .iter()
            .filter_map(|value| value.as_str().map(ToOwned::to_owned))
            .collect(),
    )
}

fn config_string_map(config: Option<&Value>, key: &str) -> Option<HashMap<String, String>> {
    let values = config?.get(key)?.as_object()?;
    Some(
        values
            .iter()
            .filter_map(|(name, value)| Some((name.clone(), value.as_str()?.to_owned())))
            .collect(),
    )
}
