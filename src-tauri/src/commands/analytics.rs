use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{AnalyticsPayload, CoreEnvelope, SessionAnalyticsPayload};
use tauri::State;

#[tauri::command]
pub(crate) fn load_usage_analytics(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<AnalyticsPayload>, String> {
    respond(state.services().analytics().load_usage())
}

#[tauri::command]
pub(crate) fn load_quota_history(
    state: State<'_, TauriAppState>,
    account_key: Option<String>,
) -> Result<CoreEnvelope<AnalyticsPayload>, String> {
    respond(state.services().analytics().load_quota_history(account_key))
}

#[tauri::command]
pub(crate) fn load_session_analytics(
    state: State<'_, TauriAppState>,
    range: Option<String>,
) -> Result<CoreEnvelope<SessionAnalyticsPayload>, String> {
    respond(state.services().analytics().load_session_analytics(range))
}

#[tauri::command]
pub(crate) fn load_token_analytics(
    state: State<'_, TauriAppState>,
    range: Option<String>,
) -> Result<CoreEnvelope<AnalyticsPayload>, String> {
    respond(
        state
            .services()
            .analytics()
            .load_range("load_token_analytics", range),
    )
}

#[tauri::command]
pub(crate) fn load_tool_analytics(
    state: State<'_, TauriAppState>,
    range: Option<String>,
) -> Result<CoreEnvelope<AnalyticsPayload>, String> {
    respond(
        state
            .services()
            .analytics()
            .load_range("load_tool_analytics", range),
    )
}

#[tauri::command]
pub(crate) fn load_change_analytics(
    state: State<'_, TauriAppState>,
    range: Option<String>,
) -> Result<CoreEnvelope<AnalyticsPayload>, String> {
    respond(
        state
            .services()
            .analytics()
            .load_range("load_change_analytics", range),
    )
}
