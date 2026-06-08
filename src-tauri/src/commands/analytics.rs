use crate::application::usecase;
use crate::contracts::analytics::{
    ChangeAnalyticsPayload, QuotaHistoryPayload, TokenAnalyticsPayload, ToolAnalyticsPayload,
    UsageAnalyticsPayload,
};
use crate::contracts::CoreEnvelope;
use crate::repository::Repository;
use std::sync::Mutex;
use tauri::State;

pub(crate) struct AnalyticsCommandBoundary;

pub(crate) trait AnalyticsCommandBoundaryPort {}

#[tauri::command]
pub fn load_usage_analytics(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<UsageAnalyticsPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::analytics::load_usage_analytics(
        &repo,
    )))
}

#[tauri::command]
pub fn load_quota_history(
    repo: State<'_, Mutex<Repository>>,
    account_key: Option<String>,
) -> Result<CoreEnvelope<QuotaHistoryPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::analytics::load_quota_history(
        &repo,
        account_key,
    )))
}

#[tauri::command]
pub fn load_token_analytics(
    repo: State<'_, Mutex<Repository>>,
    range: Option<String>,
) -> Result<CoreEnvelope<TokenAnalyticsPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::analytics::load_token_analytics(
        &repo, range,
    )))
}

#[tauri::command]
pub fn load_tool_analytics(
    repo: State<'_, Mutex<Repository>>,
    range: Option<String>,
) -> Result<CoreEnvelope<ToolAnalyticsPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::analytics::load_tool_analytics(
        &repo, range,
    )))
}

#[tauri::command]
pub fn load_change_analytics(
    repo: State<'_, Mutex<Repository>>,
    range: Option<String>,
) -> Result<CoreEnvelope<ChangeAnalyticsPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::analytics::load_change_analytics(
        &repo, range,
    )))
}
