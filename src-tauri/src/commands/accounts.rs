use crate::application::usecase;
use crate::contracts::accounts::{
    AccountExportPayload, AccountImportPayload, AccountImportPreviewPayload, AccountMonitorPayload,
    LogoutPayload, RemovePayload, SwitchPayload,
};
use crate::contracts::CoreEnvelope;
use crate::repository::Repository;
use std::sync::Mutex;
use tauri::State;

// accounts 命令只做 IPC 参数接收、仓储状态获取和 usecase 转发。
#[tauri::command]
pub fn begin_add_account_attach_monitor(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<AccountMonitorPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::accounts::begin_add_account_attach_monitor(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn switch_account(
    repo: State<'_, Mutex<Repository>>,
    account_key: String,
) -> Result<CoreEnvelope<SwitchPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::accounts::switch_account(&repo, account_key)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn switch_account_and_restart_codex(
    repo: State<'_, Mutex<Repository>>,
    account_key: String,
) -> Result<CoreEnvelope<SwitchPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::accounts::switch_account_and_restart_codex(&repo, account_key)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn remove_accounts(
    repo: State<'_, Mutex<Repository>>,
    account_keys: Vec<String>,
) -> Result<CoreEnvelope<RemovePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::accounts::remove_accounts(&repo, account_keys)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn logout(repo: State<'_, Mutex<Repository>>) -> Result<CoreEnvelope<LogoutPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::accounts::logout(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn export_accounts_to_file(
    repo: State<'_, Mutex<Repository>>,
    target_path: String,
    account_keys: Option<Vec<String>>,
) -> Result<CoreEnvelope<AccountExportPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::accounts::export_accounts_to_file(&repo, target_path, account_keys)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn preview_account_import(
    repo: State<'_, Mutex<Repository>>,
    file_path: String,
) -> Result<CoreEnvelope<AccountImportPreviewPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::accounts::preview_account_import(&repo, file_path)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn import_accounts_from_file(
    repo: State<'_, Mutex<Repository>>,
    file_path: String,
    overwrite_existing: bool,
    selected_keys: Option<Vec<String>>,
) -> Result<CoreEnvelope<AccountImportPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::accounts::import_accounts_from_file(
        &repo,
        file_path,
        overwrite_existing,
        selected_keys,
    )
    .map(CoreEnvelope::ok)
    .map_err(|error| error.to_string())
}
