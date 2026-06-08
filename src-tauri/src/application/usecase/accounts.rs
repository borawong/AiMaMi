use crate::contracts::accounts::{
    AccountExportPayload, AccountImportPayload, AccountImportPreviewPayload, AccountMonitorPayload,
    LogoutPayload, RemovePayload, SwitchPayload,
};
use crate::contracts::BackendSkeletonStatus;
use crate::core::error::CoreError;
use crate::repository::Repository;

const MODULE: &str = "accounts";
const PENDING_NOTE: &str =
    "账号后端能力当前仅补齐 IPC 空骨架，真实文件读写与平台副作用等待证据补齐。";

// accounts usecase 只标记用户动作事务边界，暂不承载真实账号业务。
pub fn begin_add_account_attach_monitor(
    _repo: &Repository,
) -> Result<AccountMonitorPayload, CoreError> {
    Ok(AccountMonitorPayload {
        backend_status: pending_status("begin_add_account_attach_monitor"),
    })
}

pub fn switch_account(
    _repo: &Repository,
    _account_key: String,
) -> Result<SwitchPayload, CoreError> {
    Ok(SwitchPayload {
        backend_status: pending_status("switch_account"),
        previous_account_key: None,
        active_account_key: None,
        active_account: None,
        auth_updated: false,
        registry_updated: false,
    })
}

pub fn switch_account_and_restart_codex(
    _repo: &Repository,
    _account_key: String,
) -> Result<SwitchPayload, CoreError> {
    Ok(SwitchPayload {
        backend_status: pending_status("switch_account_and_restart_codex"),
        previous_account_key: None,
        active_account_key: None,
        active_account: None,
        auth_updated: false,
        registry_updated: false,
    })
}

pub fn remove_accounts(
    _repo: &Repository,
    _account_keys: Vec<String>,
) -> Result<RemovePayload, CoreError> {
    Ok(RemovePayload {
        backend_status: pending_status("remove_accounts"),
        removed_account_keys: Vec::new(),
        removed_count: 0,
        previous_account_key: None,
    })
}

pub fn logout(_repo: &Repository) -> Result<LogoutPayload, CoreError> {
    Ok(LogoutPayload {
        backend_status: pending_status("logout"),
        auth_removed: false,
        auth_backed_up: false,
    })
}

pub fn export_accounts_to_file(
    _repo: &Repository,
    target_path: String,
    _account_keys: Option<Vec<String>>,
) -> Result<AccountExportPayload, CoreError> {
    Ok(AccountExportPayload {
        backend_status: pending_status("export_accounts_to_file"),
        target_path,
        account_count: 0,
        exported_at: None,
        skipped: Vec::new(),
    })
}

pub fn preview_account_import(
    _repo: &Repository,
    file_path: String,
) -> Result<AccountImportPreviewPayload, CoreError> {
    Ok(AccountImportPreviewPayload {
        backend_status: pending_status("preview_account_import"),
        file_path,
        schema_version: 1,
        kind: "account-export".to_string(),
        app_version: None,
        exported_at: None,
        exported_hostname: None,
        entries: Vec::new(),
        account_count: 0,
        conflict_count: 0,
    })
}

pub fn import_accounts_from_file(
    _repo: &Repository,
    _file_path: String,
    _overwrite_existing: bool,
    _selected_keys: Option<Vec<String>>,
) -> Result<AccountImportPayload, CoreError> {
    Ok(AccountImportPayload {
        backend_status: pending_status("import_accounts_from_file"),
        imported_count: 0,
        imported_account_keys: Vec::new(),
        skipped: Vec::new(),
        registry_account_count: 0,
        active_account_key: None,
    })
}

fn pending_status(command: &str) -> BackendSkeletonStatus {
    BackendSkeletonStatus::pending(MODULE, command, PENDING_NOTE)
}
