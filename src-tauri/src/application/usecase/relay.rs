use crate::contracts::{BackendSkeletonStatus, CoreEnvelope, RelayActionPayload};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;
use serde_json::Value;

const MODULE: &str = "relay";

/// 中文职责说明：Relay 用户动作事务 owner，真实代理配置、诊断和导入导出后续在本边界内补齐。
pub(crate) struct RelayUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> RelayUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_state(&self) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let plan = self.pending_plan("load_relay_state");
        Ok(CoreEnvelope::from_backend_plan(self.payload(&plan), &plan))
    }

    pub(crate) fn upsert_provider(
        &self,
        input: Option<Value>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        if input.as_ref().is_some_and(Value::is_null) {
            return Err(CoreError::domain(
                "empty_relay_provider_input",
                "Relay 输入不能为空。",
            ));
        }
        let plan = self.no_op_plan("upsert_relay_provider");
        let mut payload = self.payload(&plan);
        payload.input = input;
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn provider_action(
        &self,
        command: &'static str,
        provider_id: String,
        ide: Option<String>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let provider_id = required_text(
            provider_id,
            "empty_relay_provider_id",
            "Relay provider 标识不能为空。",
        )?;
        let plan = self.no_op_plan(command);
        let mut payload = self.payload(&plan);
        payload.provider_id = Some(provider_id);
        payload.ide = clean_optional_text(ide);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn set_provider_network(
        &self,
        provider_id: String,
        network: Option<String>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let provider_id = required_text(
            provider_id,
            "empty_relay_provider_id",
            "Relay provider 标识不能为空。",
        )?;
        let plan = self.no_op_plan("set_relay_provider_network");
        let mut payload = self.payload(&plan);
        payload.provider_id = Some(provider_id);
        payload.network = clean_optional_text(network);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn test_draft(
        &self,
        command: &'static str,
        input: Option<Value>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let plan = self.no_op_plan(command);
        let mut payload = self.payload(&plan);
        payload.input = input;
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn empty_action(
        &self,
        command: &'static str,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let plan = self.no_op_plan(command);
        Ok(CoreEnvelope::from_backend_plan(self.payload(&plan), &plan))
    }

    pub(crate) fn set_router_enabled(
        &self,
        enabled: bool,
        relaunch: Option<bool>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let plan = self.no_op_plan("set_codex_router_enabled");
        let mut payload = self.payload(&plan);
        payload.enabled = Some(enabled);
        payload.relaunch = relaunch.unwrap_or(false);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn export_config(
        &self,
        file_path: String,
        include_api_keys: Option<bool>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let file_path = required_text(
            file_path,
            "empty_relay_config_path",
            "Relay 配置路径不能为空。",
        )?;
        let plan = self.no_op_plan("export_relay_config");
        let mut payload = self.payload(&plan);
        payload.file_path = Some(file_path);
        payload.include_api_keys = include_api_keys.unwrap_or(false);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn import_config(
        &self,
        file_path: String,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let file_path = required_text(
            file_path,
            "empty_relay_config_path",
            "Relay 配置路径不能为空。",
        )?;
        let plan = self.no_op_plan("import_relay_config");
        let mut payload = self.payload(&plan);
        payload.file_path = Some(file_path);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn set_block_official_passthrough(
        &self,
        blocked: bool,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let plan = self.no_op_plan("set_block_official_passthrough");
        let mut payload = self.payload(&plan);
        payload.blocked = Some(blocked);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn audit_log(
        &self,
        limit: Option<i64>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let limit = limit.unwrap_or(100);
        if limit <= 0 {
            return Err(CoreError::domain(
                "invalid_relay_audit_limit",
                "Relay 审计数量必须大于 0。",
            ));
        }
        let plan = self.no_op_plan("get_passthrough_audit_log");
        let mut payload = self.payload(&plan);
        payload.limit = Some(limit);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn fix_router_issue(
        &self,
        item_id: String,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let item_id = required_text(item_id, "empty_router_issue_id", "修复项标识不能为空。")?;
        let plan = self.no_op_plan("fix_codex_router_issue");
        let mut payload = self.payload(&plan);
        payload.item_id = Some(item_id);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary())
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.relay().source_path())
    }

    fn payload(&self, plan: &BackendOperationPlan) -> RelayActionPayload {
        RelayActionPayload {
            status: BackendSkeletonStatus::from_plan(plan),
            ..Default::default()
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

fn clean_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let value = value.trim().to_owned();
        if value.is_empty() {
            None
        } else {
            Some(value)
        }
    })
}
