use crate::application::service::pending_status;
use crate::contracts::{
    BackendSkeletonStatus, CoreWarning, RelayActivePayload, RelayDiagnosticPayload,
    RelayExportPayload, RelayImportPayload, RelayPassthroughAuditEntryPayload,
    RelayProviderDraftInput, RelayProviderPayload, RelayProxyPayload, RelayRouterIssueFixPayload,
    RelayRouterMigrationPayload, RelayRouterTogglePayload, RelayStatePayload, RelayTestPayload,
};
use crate::repository::{relay as relay_repository, Repository};
use serde_json::Value;
use std::collections::HashMap;

pub(crate) struct RelayUseCaseBoundary;

pub(crate) trait RelayUseCaseBoundaryPort {}

const DEFAULT_IDE: &str = "codex";
const RELAY_SCHEMA_VERSION: i32 = 4;

/// 设置官方直连拦截开关的用户动作边界；真实持久化等待 raw/internal 证据补齐。
pub fn set_block_official_passthrough(repo: &Repository, blocked: bool) -> (bool, CoreWarning) {
    let value = relay_repository::record_passthrough_policy_intent(repo, blocked);
    (
        value,
        pending_warning(
            "set_block_official_passthrough",
            "relay 官方直连拦截开关只完成公开六边形骨架；未写入未恢复的代理配置。",
        ),
    )
}

/// 读取官方直连审计日志的用户动作边界；当前公开仓库没有可证明的日志来源。
pub fn get_passthrough_audit_log(
    repo: &Repository,
    limit: Option<u32>,
) -> (Vec<RelayPassthroughAuditEntryPayload>, CoreWarning) {
    let normalized_limit = limit.unwrap_or(50).min(200);
    (
        relay_repository::load_passthrough_audit_log(repo, normalized_limit),
        pending_warning(
            "get_passthrough_audit_log",
            "relay 官方直连审计日志只完成公开六边形骨架；当前返回空集合等待证据补齐。",
        ),
    )
}

pub fn load_relay_state(repo: &Repository) -> (RelayStatePayload, CoreWarning) {
    let command = "load_relay_state";
    (empty_state(repo, command), skeleton_warning(command))
}

pub fn upsert_relay_provider(
    _repo: &Repository,
    input: RelayProviderDraftInput,
) -> (RelayProviderPayload, CoreWarning) {
    let command = "upsert_relay_provider";
    (
        provider_from_input(command, &input, None, None),
        skeleton_warning(command),
    )
}

pub fn delete_relay_provider(
    repo: &Repository,
    _provider_id: String,
) -> (RelayStatePayload, CoreWarning) {
    let command = "delete_relay_provider";
    (empty_state(repo, command), skeleton_warning(command))
}

pub fn activate_relay_provider(
    repo: &Repository,
    _provider_id: String,
    _ide: String,
) -> (RelayStatePayload, CoreWarning) {
    let command = "activate_relay_provider";
    (empty_state(repo, command), skeleton_warning(command))
}

pub fn deactivate_relay_provider(
    repo: &Repository,
    _provider_id: String,
    _ide: String,
) -> (RelayStatePayload, CoreWarning) {
    let command = "deactivate_relay_provider";
    (empty_state(repo, command), skeleton_warning(command))
}

pub fn set_relay_provider_network(
    _repo: &Repository,
    provider_id: String,
    network: String,
) -> (RelayProviderPayload, CoreWarning) {
    let command = "set_relay_provider_network";
    let input = RelayProviderDraftInput {
        provider_id: Some(provider_id),
        network: Some(network),
        ..RelayProviderDraftInput::default()
    };
    (
        provider_from_input(command, &input, None, None),
        skeleton_warning(command),
    )
}

pub fn test_relay_provider(
    _repo: &Repository,
    _provider_id: String,
) -> (RelayTestPayload, CoreWarning) {
    let command = "test_relay_provider";
    (empty_test(command), skeleton_warning(command))
}

pub fn test_relay_draft(
    _repo: &Repository,
    _input: RelayProviderDraftInput,
) -> (RelayTestPayload, CoreWarning) {
    let command = "test_relay_draft";
    (empty_test(command), skeleton_warning(command))
}

pub fn fetch_relay_models_draft(
    _repo: &Repository,
    _input: RelayProviderDraftInput,
) -> (Vec<String>, CoreWarning) {
    let command = "fetch_relay_models_draft";
    (Vec::new(), skeleton_warning(command))
}

pub fn get_relay_active(_repo: &Repository) -> (RelayActivePayload, CoreWarning) {
    let command = "get_relay_active";
    (
        RelayActivePayload {
            backend_status: skeleton_status(command),
            enabled: false,
            active_provider: None,
            active_provider_id: None,
            ide: DEFAULT_IDE.to_string(),
        },
        skeleton_warning(command),
    )
}

pub fn get_relay_proxy_status(_repo: &Repository) -> (RelayProxyPayload, CoreWarning) {
    let command = "get_relay_proxy_status";
    (empty_proxy(command), skeleton_warning(command))
}

pub fn set_codex_router_enabled(
    repo: &Repository,
    _enabled: bool,
    _relaunch: bool,
) -> (RelayRouterTogglePayload, CoreWarning) {
    let command = "set_codex_router_enabled";
    (
        RelayRouterTogglePayload {
            backend_status: skeleton_status(command),
            state: empty_state(repo, command),
            migration: RelayRouterMigrationPayload {
                action: "pending".to_string(),
                migrated_count: 0,
                rolled_back_count: 0,
                skipped_count: 0,
                target_provider: None,
                target_model: None,
                manifest_path: None,
            },
            codex_launch_error: None,
        },
        skeleton_warning(command),
    )
}

pub fn export_relay_config(
    _repo: &Repository,
    file_path: String,
    include_api_keys: bool,
) -> (RelayExportPayload, CoreWarning) {
    let command = "export_relay_config";
    (
        RelayExportPayload {
            backend_status: skeleton_status(command),
            schema_version: Some(RELAY_SCHEMA_VERSION),
            exported_by: None,
            exported_at: None,
            file_path,
            include_api_keys,
            provider_count: 0,
            providers: Vec::new(),
        },
        skeleton_warning(command),
    )
}

pub fn import_relay_config(
    _repo: &Repository,
    file_path: String,
) -> (RelayImportPayload, CoreWarning) {
    let command = "import_relay_config";
    (
        RelayImportPayload {
            backend_status: skeleton_status(command),
            file_path,
            imported_count: 0,
            skipped_count: 0,
            total: 0,
            skipped: Vec::new(),
        },
        skeleton_warning(command),
    )
}

pub fn run_codex_router_diagnostics(_repo: &Repository) -> (RelayDiagnosticPayload, CoreWarning) {
    let command = "run_codex_router_diagnostics";
    (empty_diagnostic(command), skeleton_warning(command))
}

pub fn diagnose_codex_router(_repo: &Repository) -> (RelayDiagnosticPayload, CoreWarning) {
    let command = "diagnose_codex_router";
    (empty_diagnostic(command), skeleton_warning(command))
}

pub fn fix_codex_router_issue(
    _repo: &Repository,
    item_id: String,
) -> (RelayRouterIssueFixPayload, CoreWarning) {
    let command = "fix_codex_router_issue";
    (
        RelayRouterIssueFixPayload {
            backend_status: skeleton_status(command),
            item_id: item_id.clone(),
            issue_id: item_id,
            fixed: false,
            requires_restart: false,
            message: "修复未执行，当前只返回 relay 空骨架。".to_string(),
            details: None,
            diagnostics: empty_diagnostic(command),
        },
        skeleton_warning(command),
    )
}

fn provider_from_input(
    command: &str,
    input: &RelayProviderDraftInput,
    provider_id_override: Option<&str>,
    network_override: Option<&str>,
) -> RelayProviderPayload {
    let provider_id = provider_id_override
        .map(ToString::to_string)
        .or_else(|| input.provider_id.clone())
        .or_else(|| input.id.clone())
        .unwrap_or_else(|| "pending-relay-provider".to_string());
    let base_url = input
        .base_url
        .clone()
        .or_else(|| input.url.clone())
        .or_else(|| input.endpoint.clone())
        .unwrap_or_default();
    let model = input
        .model
        .clone()
        .or_else(|| input.default_model.clone())
        .unwrap_or_default();
    let network = network_override
        .map(ToString::to_string)
        .or_else(|| input.network.clone())
        .unwrap_or_else(|| "system".to_string());

    RelayProviderPayload {
        backend_status: skeleton_status(command),
        id: provider_id.clone(),
        ide: input.ide.clone().unwrap_or_else(|| DEFAULT_IDE.to_string()),
        name: input.name.clone().unwrap_or(provider_id),
        base_url,
        api_key: None,
        api_key_stored: input.api_key_stored.unwrap_or(false),
        model,
        wire_api: input.wire_api.clone().unwrap_or_default(),
        extra_headers: input.extra_headers.clone().unwrap_or(Value::Null),
        network,
        active: false,
        health_score: None,
        latency_ms: None,
        last_tested_at: None,
        updated_at: None,
        last_error: None,
        error_message: None,
        models_sample: Vec::new(),
    }
}

fn empty_state(repo: &Repository, command: &str) -> RelayStatePayload {
    let _ = repo.paths();
    let proxy = empty_proxy(command);
    let mut active_by_ide = HashMap::new();
    active_by_ide.insert(DEFAULT_IDE.to_string(), Vec::new());

    RelayStatePayload {
        backend_status: skeleton_status(command),
        schema_version: RELAY_SCHEMA_VERSION,
        providers: Vec::new(),
        active_by_ide,
        proxy: proxy.clone(),
        codex_router_enabled: false,
        block_official_passthrough: false,
        last_codex_route: None,
        enabled: false,
        active_provider_id: None,
        proxy_status: proxy,
        source_path: String::new(),
    }
}

fn empty_proxy(command: &str) -> RelayProxyPayload {
    RelayProxyPayload {
        backend_status: skeleton_status(command),
        running: false,
        port: 0,
        base_url: String::new(),
        codex_base_url: String::new(),
        last_error: None,
    }
}

fn empty_test(command: &str) -> RelayTestPayload {
    RelayTestPayload {
        backend_status: skeleton_status(command),
        ok: false,
        health: None,
        latency_ms: 0,
        status_code: None,
        message: None,
        error_message: Some("relay 测试未执行，当前只返回空骨架。".to_string()),
        models: Vec::new(),
    }
}

fn empty_diagnostic(command: &str) -> RelayDiagnosticPayload {
    RelayDiagnosticPayload {
        backend_status: skeleton_status(command),
        ok: false,
        codex_provider_count: 0,
        catalog_path: None,
        catalog_exists: false,
        config_toml_has_router: false,
        config_toml_has_catalog: false,
        config_toml_has_router_legacy: false,
        config_toml_has_catalog_legacy: false,
        user_top_level_profile: None,
        config_stale_reason: None,
        thread_migration_exists: false,
        router_enabled: false,
        has_issues: false,
        issues: Vec::new(),
        items: Vec::new(),
        summary: "relay 诊断未执行，当前只返回空骨架。".to_string(),
    }
}

fn skeleton_status(command: &str) -> BackendSkeletonStatus {
    let note = skeleton_note(command);
    pending_status("relay", command, &note)
}

fn skeleton_warning(command: &str) -> CoreWarning {
    let note = skeleton_note(command);
    pending_warning(command, &note)
}

fn skeleton_note(command: &str) -> String {
    format!("relay 命令 {command} 当前只补齐公开 IPC 空骨架，真实代理业务等待 raw/internal 证据。")
}

fn pending_warning(command: &str, message: &str) -> CoreWarning {
    CoreWarning {
        code: format!("relay.{command}.pending"),
        message: message.to_string(),
    }
}
