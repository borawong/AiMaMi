use crate::application::usecase;
use crate::contracts::{
    CoreEnvelope, CoreWarning, RelayActivePayload, RelayDiagnosticPayload, RelayExportPayload,
    RelayImportPayload, RelayPassthroughAuditEntryPayload, RelayProviderDraftInput,
    RelayProviderPayload, RelayProxyPayload, RelayRouterIssueFixPayload, RelayRouterTogglePayload,
    RelayStatePayload, RelayTestPayload,
};
use crate::repository::Repository;
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

pub(crate) struct RelayCommandBoundary;

pub(crate) trait RelayCommandBoundaryPort {}

#[tauri::command]
pub fn load_relay_state(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<RelayStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::load_relay_state(&repo)))
}

#[tauri::command]
pub fn upsert_relay_provider(
    repo: State<'_, Mutex<Repository>>,
    input: RelayProviderDraftInput,
) -> Result<CoreEnvelope<RelayProviderPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::upsert_relay_provider(
        &repo, input,
    )))
}

#[tauri::command]
pub fn delete_relay_provider(
    repo: State<'_, Mutex<Repository>>,
    provider_id: String,
) -> Result<CoreEnvelope<RelayStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::delete_relay_provider(
        &repo,
        provider_id,
    )))
}

#[tauri::command]
pub fn activate_relay_provider(
    repo: State<'_, Mutex<Repository>>,
    provider_id: String,
    ide: String,
) -> Result<CoreEnvelope<RelayStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::activate_relay_provider(
        &repo,
        provider_id,
        ide,
    )))
}

#[tauri::command]
pub fn deactivate_relay_provider(
    repo: State<'_, Mutex<Repository>>,
    provider_id: String,
    ide: String,
) -> Result<CoreEnvelope<RelayStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::deactivate_relay_provider(
        &repo,
        provider_id,
        ide,
    )))
}

#[tauri::command]
pub fn set_relay_provider_network(
    repo: State<'_, Mutex<Repository>>,
    provider_id: String,
    network: String,
) -> Result<CoreEnvelope<RelayProviderPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::set_relay_provider_network(
        &repo,
        provider_id,
        network,
    )))
}

#[tauri::command]
pub fn test_relay_provider(
    repo: State<'_, Mutex<Repository>>,
    provider_id: String,
) -> Result<CoreEnvelope<RelayTestPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::test_relay_provider(
        &repo,
        provider_id,
    )))
}

#[tauri::command]
pub fn test_relay_draft(
    repo: State<'_, Mutex<Repository>>,
    input: RelayProviderDraftInput,
) -> Result<CoreEnvelope<RelayTestPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::test_relay_draft(&repo, input)))
}

#[tauri::command]
pub fn fetch_relay_models_draft(
    repo: State<'_, Mutex<Repository>>,
    input: RelayProviderDraftInput,
) -> Result<CoreEnvelope<Vec<String>>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::fetch_relay_models_draft(
        &repo, input,
    )))
}

#[tauri::command]
pub fn get_relay_active(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<RelayActivePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::get_relay_active(&repo)))
}

#[tauri::command]
pub fn get_relay_proxy_status(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<RelayProxyPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::get_relay_proxy_status(&repo)))
}

#[tauri::command]
pub fn set_codex_router_enabled(
    repo: State<'_, Mutex<Repository>>,
    enabled: bool,
    relaunch: bool,
) -> Result<CoreEnvelope<RelayRouterTogglePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::set_codex_router_enabled(
        &repo, enabled, relaunch,
    )))
}

#[tauri::command]
pub fn set_block_official_passthrough(
    repo: State<'_, Mutex<Repository>>,
    blocked: bool,
) -> Result<CoreEnvelope<bool>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(
        usecase::relay::set_block_official_passthrough(&repo, blocked),
    ))
}

#[tauri::command]
pub fn get_passthrough_audit_log(
    repo: State<'_, Mutex<Repository>>,
    limit: Option<u32>,
) -> Result<CoreEnvelope<Vec<RelayPassthroughAuditEntryPayload>>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::get_passthrough_audit_log(
        &repo, limit,
    )))
}

#[tauri::command]
pub fn export_relay_config(
    repo: State<'_, Mutex<Repository>>,
    file_path: String,
    include_api_keys: bool,
) -> Result<CoreEnvelope<RelayExportPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::export_relay_config(
        &repo,
        file_path,
        include_api_keys,
    )))
}

#[tauri::command]
pub fn import_relay_config(
    repo: State<'_, Mutex<Repository>>,
    file_path: String,
) -> Result<CoreEnvelope<RelayImportPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::import_relay_config(
        &repo, file_path,
    )))
}

#[tauri::command]
pub fn run_codex_router_diagnostics(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<RelayDiagnosticPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::run_codex_router_diagnostics(
        &repo,
    )))
}

#[tauri::command]
pub fn diagnose_codex_router(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<RelayDiagnosticPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::diagnose_codex_router(&repo)))
}

#[tauri::command]
pub fn fix_codex_router_issue(
    repo: State<'_, Mutex<Repository>>,
    item_id: String,
) -> Result<CoreEnvelope<RelayRouterIssueFixPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(with_warning(usecase::relay::fix_codex_router_issue(
        &repo, item_id,
    )))
}

fn with_warning<T: Serialize>((payload, warning): (T, CoreWarning)) -> CoreEnvelope<T> {
    CoreEnvelope::ok_with_warnings(payload, vec![warning])
}
