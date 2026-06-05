use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{AccountActionPayload, CoreEnvelope};
use tauri::State;

#[tauri::command]
pub(crate) fn begin_add_account_attach_monitor(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(state.services().accounts().begin_attach_monitor())
}

#[tauri::command]
pub(crate) fn switch_account(
    state: State<'_, TauriAppState>,
    account_key: String,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(
        state
            .services()
            .accounts()
            .switch_account("switch_account", account_key),
    )
}

#[tauri::command]
pub(crate) fn switch_account_and_restart_codex(
    state: State<'_, TauriAppState>,
    account_key: String,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(
        state
            .services()
            .accounts()
            .switch_account("switch_account_and_restart_codex", account_key),
    )
}

#[tauri::command]
pub(crate) fn remove_accounts(
    state: State<'_, TauriAppState>,
    account_keys: Vec<String>,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(state.services().accounts().remove_accounts(account_keys))
}

#[tauri::command]
pub(crate) fn logout(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(state.services().accounts().logout())
}

#[tauri::command]
pub(crate) fn import_chatgpt_session_account(
    state: State<'_, TauriAppState>,
    session_json: Option<String>,
    overwrite_existing: Option<bool>,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(
        state
            .services()
            .accounts()
            .import_chatgpt_session_account(session_json, overwrite_existing),
    )
}

#[tauri::command]
pub(crate) fn export_accounts_to_file(
    state: State<'_, TauriAppState>,
    account_keys: Vec<String>,
    target_path: String,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(
        state
            .services()
            .accounts()
            .export_accounts_to_file(account_keys, target_path),
    )
}

#[tauri::command]
pub(crate) fn preview_account_import(
    state: State<'_, TauriAppState>,
    file_path: String,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(
        state
            .services()
            .accounts()
            .preview_account_import(file_path),
    )
}

#[tauri::command]
pub(crate) fn import_accounts_from_file(
    state: State<'_, TauriAppState>,
    file_path: String,
    overwrite_existing: Option<bool>,
    selected_keys: Option<Vec<String>>,
) -> Result<CoreEnvelope<AccountActionPayload>, String> {
    respond(state.services().accounts().import_accounts_from_file(
        file_path,
        overwrite_existing,
        selected_keys,
    ))
}
