use crate::application::usecase;
use crate::contracts::{CoreEnvelope, RelayPassthroughAuditEntryPayload};
use crate::repository::Repository;
use std::sync::Mutex;
use tauri::State;

pub(crate) struct RelayCommandBoundary;

pub(crate) trait RelayCommandBoundaryPort {}

#[tauri::command]
pub fn set_block_official_passthrough(
    repo: State<'_, Mutex<Repository>>,
    blocked: bool,
) -> Result<CoreEnvelope<bool>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    let (payload, warning) = usecase::relay::set_block_official_passthrough(&repo, blocked);
    Ok(CoreEnvelope::ok_with_warnings(payload, vec![warning]))
}

#[tauri::command]
pub fn get_passthrough_audit_log(
    repo: State<'_, Mutex<Repository>>,
    limit: Option<u32>,
) -> Result<CoreEnvelope<Vec<RelayPassthroughAuditEntryPayload>>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    let (payload, warning) = usecase::relay::get_passthrough_audit_log(&repo, limit);
    Ok(CoreEnvelope::ok_with_warnings(payload, vec![warning]))
}
