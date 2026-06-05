use crate::contracts::{
    CoreEnvelope, McpServerListPayload, McpServerMutationPayload, McpServerRemovePayload,
    McpServerSummary, McpTransport,
};
use crate::core::error::CoreError;
use crate::core::parser;
use crate::repository::RepositoryBundle;
use serde_json::Value;
use std::collections::HashMap;

/// 中文职责说明：MCP upsert 输入 DTO，由 command 反序列化后交给 MCP 事务 owner 解释。
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

/// 中文职责说明：MCP 服务配置用户动作事务 owner，真实配置读写后续只能在本边界补齐。
pub(crate) struct McpUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> McpUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_servers(&self) -> Result<CoreEnvelope<McpServerListPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            McpServerListPayload {
                source_path: self.repositories.config().source_path(),
                ..McpServerListPayload::default()
            },
            "mcp_servers",
        ))
    }

    pub(crate) fn upsert_server(
        &self,
        input: McpUpsertInput,
    ) -> Result<CoreEnvelope<McpServerMutationPayload>, CoreError> {
        if input.name.trim().is_empty() {
            return Err(CoreError::domain("empty_mcp_name", "MCP 名称不能为空。"));
        }
        Ok(CoreEnvelope::no_op(
            McpServerMutationPayload {
                server: server_from_input(input),
                total: 0,
                source_path: self.repositories.config().source_path(),
            },
            "upsert_mcp_server",
        ))
    }

    pub(crate) fn set_server_enabled(
        &self,
        name: String,
        enabled: bool,
    ) -> Result<CoreEnvelope<McpServerMutationPayload>, CoreError> {
        if name.trim().is_empty() {
            return Err(CoreError::domain("empty_mcp_name", "MCP 名称不能为空。"));
        }
        Ok(CoreEnvelope::no_op(
            McpServerMutationPayload {
                server: McpServerSummary {
                    name,
                    enabled,
                    ..McpServerSummary::default()
                },
                total: 0,
                source_path: self.repositories.config().source_path(),
            },
            "set_mcp_server_enabled",
        ))
    }

    pub(crate) fn remove_server(
        &self,
        name: String,
    ) -> Result<CoreEnvelope<McpServerRemovePayload>, CoreError> {
        if name.trim().is_empty() {
            return Err(CoreError::domain("empty_mcp_name", "MCP 名称不能为空。"));
        }
        Ok(CoreEnvelope::no_op(
            McpServerRemovePayload {
                removed_name: name,
                total: 0,
                source_path: self.repositories.config().source_path(),
            },
            "remove_mcp_server",
        ))
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
            .map(parser::parse_mcp_transport)
            .unwrap_or(McpTransport::Unknown),
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
