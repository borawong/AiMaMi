use crate::contracts::{
    BackendSkeletonStatus, CoreEnvelope, McpServerListPayload, McpServerMutationPayload,
    McpServerRemovePayload, McpServerSummary, McpTransport,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::core::parser;
use crate::repository::RepositoryBundle;
use serde_json::Value;
use std::collections::HashMap;

const MODULE: &str = "mcp";

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
        let plan = self.pending_plan("mcp_servers");
        Ok(CoreEnvelope::from_backend_plan(
            self.list_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn upsert_server(
        &self,
        mut input: McpUpsertInput,
    ) -> Result<CoreEnvelope<McpServerMutationPayload>, CoreError> {
        input.name = required_text(input.name, "empty_mcp_name", "MCP 名称不能为空。")?;
        reject_null_config(input.config.as_ref())?;
        let plan = self.no_op_plan("upsert_mcp_server");
        Ok(CoreEnvelope::from_backend_plan(
            self.mutation_payload(&plan, server_from_input(input)),
            &plan,
        ))
    }

    pub(crate) fn set_server_enabled(
        &self,
        name: String,
        enabled: bool,
    ) -> Result<CoreEnvelope<McpServerMutationPayload>, CoreError> {
        let name = required_text(name, "empty_mcp_name", "MCP 名称不能为空。")?;
        let plan = self.no_op_plan("set_mcp_server_enabled");
        Ok(CoreEnvelope::from_backend_plan(
            self.mutation_payload(
                &plan,
                McpServerSummary {
                    name,
                    enabled,
                    source_path: self.repositories.config().source_path(),
                    ..McpServerSummary::default()
                },
            ),
            &plan,
        ))
    }

    pub(crate) fn remove_server(
        &self,
        name: String,
    ) -> Result<CoreEnvelope<McpServerRemovePayload>, CoreError> {
        let name = required_text(name, "empty_mcp_name", "MCP 名称不能为空。")?;
        let plan = self.no_op_plan("remove_mcp_server");
        Ok(CoreEnvelope::from_backend_plan(
            self.remove_payload(&plan, name),
            &plan,
        ))
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary())
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.config().source_path())
    }

    fn list_payload(&self, plan: &BackendOperationPlan) -> McpServerListPayload {
        McpServerListPayload {
            status: BackendSkeletonStatus::from_plan(plan),
            source_path: self.repositories.config().source_path(),
            ..McpServerListPayload::default()
        }
    }

    fn mutation_payload(
        &self,
        plan: &BackendOperationPlan,
        mut server: McpServerSummary,
    ) -> McpServerMutationPayload {
        let source_path = self.repositories.config().source_path();
        if server.source_path.trim().is_empty() {
            server.source_path = source_path.clone();
        }
        McpServerMutationPayload {
            status: BackendSkeletonStatus::from_plan(plan),
            server,
            total: 0,
            source_path,
        }
    }

    fn remove_payload(
        &self,
        plan: &BackendOperationPlan,
        removed_name: String,
    ) -> McpServerRemovePayload {
        McpServerRemovePayload {
            status: BackendSkeletonStatus::from_plan(plan),
            removed_name,
            total: 0,
            source_path: self.repositories.config().source_path(),
        }
    }
}

fn required_text(
    value: String,
    code: &'static str,
    public_message: &'static str,
) -> Result<String, CoreError> {
    let value = value.trim().to_owned();
    if value.is_empty() {
        Err(CoreError::domain(code, public_message))
    } else {
        Ok(value)
    }
}

fn reject_null_config(value: Option<&Value>) -> Result<(), CoreError> {
    if value.is_some_and(Value::is_null) {
        Err(CoreError::domain("empty_mcp_config", "MCP 配置不能为空。"))
    } else {
        Ok(())
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
