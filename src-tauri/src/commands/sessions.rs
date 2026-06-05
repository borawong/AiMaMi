use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{CoreEnvelope, SessionsPayload};
use tauri::State;

#[tauri::command]
pub(crate) fn load_sessions(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<SessionsPayload>, String> {
    respond(state.services().sessions().load_sessions())
}

#[tauri::command]
pub(crate) fn delete_sessions(
    state: State<'_, TauriAppState>,
    ids: Vec<String>,
) -> Result<CoreEnvelope<SessionsPayload>, String> {
    respond(state.services().sessions().delete_sessions(ids))
}
