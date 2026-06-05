use crate::contracts::{BackendSkeletonStatus, CoreEnvelope, RelayActionPayload};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;
use serde_json::Value;

/// 中文职责说明：Relay 用户动作事务 owner，真实代理配置、诊断和导入导出后续在本边界内补齐。
pub(crate) struct RelayUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> RelayUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_state(&self) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let _source_path = self.repositories.relay().source_path();
        Ok(CoreEnvelope::pending(
            self.payload("load_relay_state"),
            "load_relay_state",
        ))
    }

    pub(crate) fn upsert_provider(
        &self,
        input: Option<Value>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload("upsert_relay_provider");
        payload.input = input;
        Ok(CoreEnvelope::no_op(payload, "upsert_relay_provider"))
    }

    pub(crate) fn provider_action(
        &self,
        command: &'static str,
        provider_id: String,
        ide: Option<String>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload(command);
        payload.provider_id = Some(provider_id);
        payload.ide = ide;
        Ok(CoreEnvelope::no_op(payload, command))
    }

    pub(crate) fn set_provider_network(
        &self,
        provider_id: String,
        network: Option<String>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload("set_relay_provider_network");
        payload.provider_id = Some(provider_id);
        payload.network = network;
        Ok(CoreEnvelope::no_op(payload, "set_relay_provider_network"))
    }

    pub(crate) fn test_draft(
        &self,
        command: &'static str,
        input: Option<Value>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload(command);
        payload.input = input;
        Ok(CoreEnvelope::no_op(payload, command))
    }

    pub(crate) fn empty_action(
        &self,
        command: &'static str,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(self.payload(command), command))
    }

    pub(crate) fn set_router_enabled(
        &self,
        enabled: bool,
        relaunch: Option<bool>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload("set_codex_router_enabled");
        payload.enabled = Some(enabled);
        payload.relaunch = relaunch.unwrap_or(false);
        Ok(CoreEnvelope::no_op(payload, "set_codex_router_enabled"))
    }

    pub(crate) fn export_config(
        &self,
        file_path: String,
        include_api_keys: Option<bool>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload("export_relay_config");
        payload.file_path = Some(file_path);
        payload.include_api_keys = include_api_keys.unwrap_or(false);
        Ok(CoreEnvelope::no_op(payload, "export_relay_config"))
    }

    pub(crate) fn import_config(
        &self,
        file_path: String,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload("import_relay_config");
        payload.file_path = Some(file_path);
        Ok(CoreEnvelope::no_op(payload, "import_relay_config"))
    }

    pub(crate) fn set_block_official_passthrough(
        &self,
        blocked: bool,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload("set_block_official_passthrough");
        payload.blocked = Some(blocked);
        Ok(CoreEnvelope::no_op(
            payload,
            "set_block_official_passthrough",
        ))
    }

    pub(crate) fn audit_log(
        &self,
        limit: Option<i64>,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload("get_passthrough_audit_log");
        payload.limit = Some(limit.unwrap_or(100));
        Ok(CoreEnvelope::no_op(payload, "get_passthrough_audit_log"))
    }

    pub(crate) fn fix_router_issue(
        &self,
        item_id: String,
    ) -> Result<CoreEnvelope<RelayActionPayload>, CoreError> {
        let mut payload = self.payload("fix_codex_router_issue");
        payload.item_id = Some(item_id);
        Ok(CoreEnvelope::no_op(payload, "fix_codex_router_issue"))
    }

    fn payload(&self, command: &'static str) -> RelayActionPayload {
        RelayActionPayload {
            status: BackendSkeletonStatus::for_command("relay", command),
            ..Default::default()
        }
    }
}
