use crate::contracts::{
    BackendSkeletonStatus, CoreEnvelope, RelayActiveByIdePayload, RelayActivePayload,
    RelayDiagnosticIssuePayload, RelayDiagnosticPayload, RelayExportPayload, RelayExtraHeaders,
    RelayImportPayload, RelayPassthroughAuditEntry, RelayProviderDraftInput, RelayProviderPayload,
    RelayProxyPayload, RelayRouterIssueFixPayload, RelayRouterMigrationPayload,
    RelayRouterTogglePayload, RelayStatePayload, RelayTestPayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;
use std::collections::BTreeMap;

const MODULE: &str = "relay";
const DEFAULT_IDE: &str = "codex";

pub(crate) struct RelayUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> RelayUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_state(&self) -> Result<CoreEnvelope<RelayStatePayload>, CoreError> {
        let plan = self.pending_plan("load_relay_state");
        if let Some(state) = self.relay_repository_state(&plan)? {
            return Ok(CoreEnvelope::from_backend_plan(state, &plan));
        }

        Ok(CoreEnvelope::from_backend_plan(
            self.state_payload(&plan, None, false, false),
            &plan,
        ))
    }

    pub(crate) fn upsert_provider(
        &self,
        input: Option<RelayProviderDraftInput>,
    ) -> Result<CoreEnvelope<RelayProviderPayload>, CoreError> {
        let input = required_input(input)?;
        let plan = self.no_op_plan("upsert_relay_provider");
        Ok(CoreEnvelope::from_backend_plan(
            self.provider_payload(&plan, &input, false),
            &plan,
        ))
    }

    pub(crate) fn delete_provider(
        &self,
        provider_id: String,
    ) -> Result<CoreEnvelope<RelayStatePayload>, CoreError> {
        let _provider_id = required_text(
            provider_id,
            "empty_relay_provider_id",
            "Relay provider 标识不能为空。",
        )?;
        let plan = self.no_op_plan("delete_relay_provider");
        Ok(CoreEnvelope::from_backend_plan(
            self.state_payload(&plan, None, false, false),
            &plan,
        ))
    }

    pub(crate) fn activate_provider(
        &self,
        provider_id: String,
        ide: Option<String>,
    ) -> Result<CoreEnvelope<RelayStatePayload>, CoreError> {
        let provider_id = required_text(
            provider_id,
            "empty_relay_provider_id",
            "Relay provider 标识不能为空。",
        )?;
        let plan = self.no_op_plan("activate_relay_provider");
        let ide = clean_optional_text(ide).unwrap_or_else(|| DEFAULT_IDE.to_owned());
        Ok(CoreEnvelope::from_backend_plan(
            self.state_payload(&plan, Some((ide, provider_id)), true, false),
            &plan,
        ))
    }

    pub(crate) fn deactivate_provider(
        &self,
        provider_id: String,
        ide: Option<String>,
    ) -> Result<CoreEnvelope<RelayStatePayload>, CoreError> {
        let _provider_id = required_text(
            provider_id,
            "empty_relay_provider_id",
            "Relay provider 标识不能为空。",
        )?;
        let plan = self.no_op_plan("deactivate_relay_provider");
        let ide = clean_optional_text(ide).unwrap_or_else(|| DEFAULT_IDE.to_owned());
        Ok(CoreEnvelope::from_backend_plan(
            self.state_payload(&plan, Some((ide, String::new())), false, false),
            &plan,
        ))
    }

    pub(crate) fn set_provider_network(
        &self,
        provider_id: String,
        network: Option<String>,
    ) -> Result<CoreEnvelope<RelayProviderPayload>, CoreError> {
        let provider_id = required_text(
            provider_id,
            "empty_relay_provider_id",
            "Relay provider 标识不能为空。",
        )?;
        let plan = self.no_op_plan("set_relay_provider_network");
        let input = RelayProviderDraftInput {
            id: Some(provider_id),
            network: clean_optional_text(network),
            ..Default::default()
        };
        Ok(CoreEnvelope::from_backend_plan(
            self.provider_payload(&plan, &input, false),
            &plan,
        ))
    }

    pub(crate) fn test_provider(
        &self,
        provider_id: String,
    ) -> Result<CoreEnvelope<RelayTestPayload>, CoreError> {
        let _provider_id = required_text(
            provider_id,
            "empty_relay_provider_id",
            "Relay provider 标识不能为空。",
        )?;
        let plan = self.no_op_plan("test_relay_provider");
        Ok(CoreEnvelope::from_backend_plan(
            self.test_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn test_draft(
        &self,
        input: Option<RelayProviderDraftInput>,
    ) -> Result<CoreEnvelope<RelayTestPayload>, CoreError> {
        let _input = required_input(input)?;
        let plan = self.no_op_plan("test_relay_draft");
        Ok(CoreEnvelope::from_backend_plan(
            self.test_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn fetch_models_draft(
        &self,
        input: Option<RelayProviderDraftInput>,
    ) -> Result<CoreEnvelope<Vec<String>>, CoreError> {
        let _input = required_input(input)?;
        let plan = self.no_op_plan("fetch_relay_models_draft");
        Ok(CoreEnvelope::from_backend_plan(Vec::new(), &plan))
    }

    pub(crate) fn get_active(&self) -> Result<CoreEnvelope<RelayActivePayload>, CoreError> {
        let plan = self.no_op_plan("get_relay_active");
        if let Some(state) = self.relay_repository_state(&plan)? {
            let active_provider_id = state
                .active_provider_id
                .or_else(|| first_codex_active(&state.active_by_ide));
            return Ok(CoreEnvelope::from_backend_plan(
                RelayActivePayload {
                    backend_status: Some(self.status(&plan)),
                    enabled: state.enabled || state.codex_router_enabled,
                    active_provider: active_provider_id.clone(),
                    active_provider_id,
                    ide: DEFAULT_IDE.to_owned(),
                },
                &plan,
            ));
        }

        Ok(CoreEnvelope::from_backend_plan(
            RelayActivePayload {
                backend_status: Some(self.status(&plan)),
                enabled: false,
                active_provider: None,
                active_provider_id: None,
                ide: DEFAULT_IDE.to_owned(),
            },
            &plan,
        ))
    }

    pub(crate) fn get_proxy_status(&self) -> Result<CoreEnvelope<RelayProxyPayload>, CoreError> {
        let plan = self.no_op_plan("get_relay_proxy_status");
        if let Some(state) = self.relay_repository_state(&plan)? {
            return Ok(CoreEnvelope::from_backend_plan(state.proxy_status, &plan));
        }

        Ok(CoreEnvelope::from_backend_plan(
            self.proxy_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn set_router_enabled(
        &self,
        enabled: bool,
        relaunch: Option<bool>,
    ) -> Result<CoreEnvelope<RelayRouterTogglePayload>, CoreError> {
        let plan = self.no_op_plan("set_codex_router_enabled");
        Ok(CoreEnvelope::from_backend_plan(
            RelayRouterTogglePayload {
                backend_status: Some(self.status(&plan)),
                state: self.state_payload(&plan, None, enabled, false),
                migration: RelayRouterMigrationPayload {
                    action: if enabled { "preserve" } else { "none" }.to_owned(),
                    migrated_count: 0,
                    rolled_back_count: 0,
                    skipped_count: 0,
                    target_provider: None,
                    target_model: None,
                    manifest_path: None,
                },
                codex_launch_error: relaunch
                    .filter(|value| *value)
                    .map(|_| "后端骨架未执行 Codex 重启。".to_owned()),
            },
            &plan,
        ))
    }

    pub(crate) fn export_config(
        &self,
        file_path: String,
        include_api_keys: Option<bool>,
    ) -> Result<CoreEnvelope<RelayExportPayload>, CoreError> {
        let file_path = required_text(
            file_path,
            "empty_relay_config_path",
            "Relay 配置路径不能为空。",
        )?;
        let plan = self.no_op_plan("export_relay_config");
        Ok(CoreEnvelope::from_backend_plan(
            RelayExportPayload {
                backend_status: Some(self.status(&plan)),
                schema_version: 4,
                exported_by: "OpenAiMami".to_owned(),
                exported_at: None,
                file_path,
                include_api_keys: include_api_keys.unwrap_or(false),
                provider_count: 0,
                providers: Vec::new(),
            },
            &plan,
        ))
    }

    pub(crate) fn import_config(
        &self,
        file_path: String,
    ) -> Result<CoreEnvelope<RelayImportPayload>, CoreError> {
        let file_path = required_text(
            file_path,
            "empty_relay_config_path",
            "Relay 配置路径不能为空。",
        )?;
        let plan = self.no_op_plan("import_relay_config");
        Ok(CoreEnvelope::from_backend_plan(
            RelayImportPayload {
                backend_status: Some(self.status(&plan)),
                file_path,
                imported_count: 0,
                skipped_count: 0,
                total: 0,
                skipped: Vec::new(),
            },
            &plan,
        ))
    }

    pub(crate) fn set_block_official_passthrough(
        &self,
        blocked: bool,
    ) -> Result<CoreEnvelope<bool>, CoreError> {
        let plan = self.no_op_plan("set_block_official_passthrough");
        Ok(CoreEnvelope::from_backend_plan(blocked, &plan))
    }

    pub(crate) fn audit_log(
        &self,
        limit: Option<i64>,
    ) -> Result<CoreEnvelope<Vec<RelayPassthroughAuditEntry>>, CoreError> {
        let limit = limit.unwrap_or(50);
        if limit <= 0 {
            return Err(CoreError::domain(
                "invalid_relay_audit_limit",
                "Relay 审计数量必须大于 0。",
            ));
        }
        let plan = self.no_op_plan("get_passthrough_audit_log");
        Ok(CoreEnvelope::from_backend_plan(Vec::new(), &plan))
    }

    pub(crate) fn diagnose_codex_router(
        &self,
    ) -> Result<CoreEnvelope<RelayDiagnosticPayload>, CoreError> {
        let plan = self.no_op_plan("diagnose_codex_router");
        Ok(CoreEnvelope::from_backend_plan(
            self.diagnostic_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn run_codex_router_diagnostics(
        &self,
    ) -> Result<CoreEnvelope<RelayDiagnosticPayload>, CoreError> {
        let plan = self.no_op_plan("run_codex_router_diagnostics");
        Ok(CoreEnvelope::from_backend_plan(
            self.diagnostic_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn fix_router_issue(
        &self,
        item_id: String,
    ) -> Result<CoreEnvelope<RelayRouterIssueFixPayload>, CoreError> {
        let item_id = required_text(item_id, "empty_router_issue_id", "修复项标识不能为空。")?;
        let plan = self.no_op_plan("fix_codex_router_issue");
        Ok(CoreEnvelope::from_backend_plan(
            RelayRouterIssueFixPayload {
                backend_status: Some(self.status(&plan)),
                issue_id: item_id.clone(),
                item_id,
                fixed: false,
                requires_restart: false,
                message: "后端骨架未执行配置修复。".to_owned(),
                details: None,
                diagnostics: self.diagnostic_payload(&plan),
            },
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
        BackendBoundaryProbe::from_repository_source(self.repositories.relay().source_path())
    }

    fn status(&self, plan: &BackendOperationPlan) -> BackendSkeletonStatus {
        BackendSkeletonStatus::from_plan(plan)
    }

    fn source_path(&self) -> String {
        self.repositories.relay().source_path()
    }

    fn relay_repository_state(
        &self,
        plan: &BackendOperationPlan,
    ) -> Result<Option<RelayStatePayload>, CoreError> {
        self.repositories
            .relay()
            .load_state()
            .map(|state| state.map(|state| self.with_backend_status(state, plan)))
    }

    fn with_backend_status(
        &self,
        mut state: RelayStatePayload,
        plan: &BackendOperationPlan,
    ) -> RelayStatePayload {
        let status = Some(self.status(plan));
        state.backend_status = status.clone();
        for provider in &mut state.providers {
            provider.backend_status = status.clone();
            provider.api_key = None;
        }
        state.proxy.backend_status = status.clone();
        state.proxy_status.backend_status = status;
        state
    }

    fn state_payload(
        &self,
        plan: &BackendOperationPlan,
        active_provider: Option<(String, String)>,
        router_enabled: bool,
        blocked: bool,
    ) -> RelayStatePayload {
        let proxy = self.proxy_payload(plan);
        let active_by_ide = active_map(active_provider.as_ref());
        let active_provider_id = active_provider.and_then(|(_, provider_id)| {
            if provider_id.is_empty() {
                None
            } else {
                Some(provider_id)
            }
        });
        RelayStatePayload {
            backend_status: Some(self.status(plan)),
            schema_version: 4,
            providers: Vec::new(),
            active_by_ide,
            proxy_status: proxy.clone(),
            proxy,
            codex_router_enabled: router_enabled,
            block_official_passthrough: blocked,
            last_codex_route: active_provider_id.clone(),
            enabled: router_enabled,
            active_provider_id,
            source_path: self.source_path(),
        }
    }

    fn proxy_payload(&self, plan: &BackendOperationPlan) -> RelayProxyPayload {
        RelayProxyPayload {
            backend_status: Some(self.status(plan)),
            running: false,
            port: 0,
            base_url: String::new(),
            codex_base_url: String::new(),
            last_error: None,
        }
    }

    fn provider_payload(
        &self,
        plan: &BackendOperationPlan,
        input: &RelayProviderDraftInput,
        active: bool,
    ) -> RelayProviderPayload {
        let id = first_text([input.id.as_ref(), input.provider_id.as_ref()])
            .unwrap_or("pending-relay-provider")
            .to_owned();
        let name = first_text([input.name.as_ref()]).unwrap_or(&id).to_owned();
        RelayProviderPayload {
            backend_status: Some(self.status(plan)),
            id,
            ide: first_text([input.ide.as_ref()])
                .unwrap_or(DEFAULT_IDE)
                .to_owned(),
            name,
            base_url: first_text([
                input.base_url.as_ref(),
                input.url.as_ref(),
                input.endpoint.as_ref(),
            ])
            .unwrap_or_default()
            .to_owned(),
            api_key: None,
            api_key_stored: input.api_key_stored.unwrap_or(false),
            model: first_text([input.model.as_ref(), input.default_model.as_ref()])
                .unwrap_or_default()
                .to_owned(),
            wire_api: first_text([input.wire_api.as_ref()])
                .unwrap_or("openai-chat")
                .to_owned(),
            extra_headers: input.extra_headers.clone().or_else(empty_headers),
            network: first_text([input.network.as_ref()])
                .unwrap_or("system")
                .to_owned(),
            active,
            health_score: None,
            latency_ms: None,
            last_tested_at: None,
            updated_at: None,
            last_error: None,
            error_message: None,
            models_sample: Vec::new(),
        }
    }

    fn test_payload(&self, plan: &BackendOperationPlan) -> RelayTestPayload {
        RelayTestPayload {
            backend_status: Some(self.status(plan)),
            ok: false,
            health: 0,
            latency_ms: 0,
            status_code: None,
            message: Some("后端骨架未执行网络探测。".to_owned()),
            error_message: Some("后端骨架未执行网络探测。".to_owned()),
            models: Vec::new(),
        }
    }

    fn diagnostic_payload(&self, plan: &BackendOperationPlan) -> RelayDiagnosticPayload {
        RelayDiagnosticPayload {
            backend_status: Some(self.status(plan)),
            ok: true,
            codex_provider_count: 0,
            catalog_path: None,
            catalog_exists: false,
            config_toml_has_router: false,
            config_toml_has_catalog: false,
            config_toml_has_router_raw: false,
            config_toml_has_catalog_raw: false,
            user_top_level_profile: None,
            config_stale_reason: None,
            thread_migration_exists: false,
            router_enabled: false,
            has_issues: false,
            issues: Vec::new(),
            items: Vec::new(),
            summary: "后端骨架未执行路由诊断。".to_owned(),
        }
    }
}

fn required_input(
    input: Option<RelayProviderDraftInput>,
) -> Result<RelayProviderDraftInput, CoreError> {
    input.ok_or_else(|| CoreError::domain("empty_relay_provider_input", "Relay 输入不能为空。"))
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

fn first_text<const N: usize>(values: [Option<&String>; N]) -> Option<&str> {
    values.into_iter().flatten().find_map(|value| {
        let value = value.trim();
        if value.is_empty() {
            None
        } else {
            Some(value)
        }
    })
}

fn active_map(active_provider: Option<&(String, String)>) -> RelayActiveByIdePayload {
    let mut active_by_ide = BTreeMap::new();
    match active_provider {
        Some((ide, provider_id)) if !provider_id.is_empty() => {
            active_by_ide.insert(ide.clone(), vec![provider_id.clone()]);
        }
        Some((ide, _)) => {
            active_by_ide.insert(ide.clone(), Vec::new());
        }
        None => {
            active_by_ide.insert(DEFAULT_IDE.to_owned(), Vec::new());
        }
    }
    active_by_ide
}

fn first_codex_active(active_by_ide: &RelayActiveByIdePayload) -> Option<String> {
    active_by_ide.get(DEFAULT_IDE).and_then(|providers| {
        providers.iter().find_map(|provider| {
            let provider = provider.trim();
            if provider.is_empty() {
                None
            } else {
                Some(provider.to_owned())
            }
        })
    })
}

fn empty_headers() -> Option<RelayExtraHeaders> {
    Some(RelayExtraHeaders::Map(BTreeMap::new()))
}
