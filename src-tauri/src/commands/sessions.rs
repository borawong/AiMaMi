use crate::application::usecase;
use crate::contracts::analytics::SessionAnalyticsPayload;
use crate::contracts::sessions::{
    AccountSessionImportPayload, SessionsDeletePayload, SessionsListPayload,
};
use crate::contracts::CoreEnvelope;
use crate::repository::Repository;
use std::sync::Mutex;
use tauri::State;

pub(crate) struct SessionsCommandBoundary;

pub(crate) trait SessionsCommandBoundaryPort {}

#[tauri::command]
pub fn load_sessions(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<SessionsListPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::sessions::load_sessions(&repo)))
}

#[tauri::command]
pub fn delete_sessions(
    repo: State<'_, Mutex<Repository>>,
    ids: Vec<String>,
) -> Result<CoreEnvelope<SessionsDeletePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::sessions::delete_sessions(
        &repo, ids,
    )))
}

#[tauri::command]
pub fn import_chatgpt_session_account(
    repo: State<'_, Mutex<Repository>>,
    session_json: String,
    overwrite_existing: Option<bool>,
) -> Result<CoreEnvelope<AccountSessionImportPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(
        usecase::sessions::import_chatgpt_session_account(
            &repo,
            session_json,
            overwrite_existing.unwrap_or(false),
        ),
    ))
}

#[tauri::command]
pub fn load_session_analytics(
    repo: State<'_, Mutex<Repository>>,
    range: Option<String>,
) -> Result<CoreEnvelope<SessionAnalyticsPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    Ok(CoreEnvelope::ok(usecase::sessions::load_session_analytics(
        &repo, range,
    )))
}
