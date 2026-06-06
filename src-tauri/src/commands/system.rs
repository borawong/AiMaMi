use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{
    ApiModePayload, ApiProxyDetectPayload, ApiProxyMode, ApiProxyTestPayload,
    AutoSwitchConfigPayload, BootstrapStatePayload, CleanPayload, CoreEnvelope,
    CoreSnapshotPayload, DaemonRunPayload, DiagnosePayload, MysteryRouteGrant,
    NotificationClientStatePayload, PendingAutoSwitchStatePayload, RebuildRegistryPayload,
    SystemInfo, UpdateInstallabilityPayload,
};
use serde_json::Value;
use tauri::State;

#[tauri::command]
pub(crate) fn load_snapshot(
    state: State<'_, TauriAppState>,
    local_only: Option<bool>,
) -> Result<CoreEnvelope<CoreSnapshotPayload>, String> {
    respond(
        state
            .services()
            .system()
            .load_snapshot(local_only.unwrap_or(false)),
    )
}

#[tauri::command]
pub(crate) fn refresh_usage_snapshot(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<CoreSnapshotPayload>, String> {
    respond(state.services().system().refresh_usage_snapshot())
}

#[tauri::command]
pub(crate) fn clean(state: State<'_, TauriAppState>) -> Result<CoreEnvelope<CleanPayload>, String> {
    respond(state.services().system().clean())
}

#[tauri::command]
pub(crate) fn rebuild_registry(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<RebuildRegistryPayload>, String> {
    respond(state.services().system().rebuild_registry())
}

#[tauri::command]
pub(crate) fn set_auto_switch(
    state: State<'_, TauriAppState>,
    enabled: bool,
) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, String> {
    respond(state.services().system().set_auto_switch(enabled))
}

#[tauri::command]
pub(crate) fn configure_auto_switch(
    state: State<'_, TauriAppState>,
    threshold5h_percent: Option<i32>,
    threshold_weekly_percent: Option<i32>,
) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, String> {
    respond(
        state
            .services()
            .system()
            .configure_auto_switch(threshold5h_percent, threshold_weekly_percent),
    )
}

#[tauri::command]
pub(crate) fn set_api_proxy_config(
    state: State<'_, TauriAppState>,
    mode: ApiProxyMode,
    url: Option<String>,
) -> Result<CoreEnvelope<ApiModePayload>, String> {
    respond(state.services().system().set_api_proxy_config(mode, url))
}

#[tauri::command]
pub(crate) fn test_api_proxy_config(
    state: State<'_, TauriAppState>,
    mode: ApiProxyMode,
    url: Option<String>,
) -> Result<CoreEnvelope<ApiProxyTestPayload>, String> {
    respond(state.services().system().test_api_proxy_config(mode, url))
}

#[tauri::command]
pub(crate) fn detect_api_proxy_config(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<ApiProxyDetectPayload>, String> {
    respond(state.services().system().detect_api_proxy_config())
}

#[tauri::command]
pub(crate) fn get_usage_refresh_interval(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<String>, String> {
    respond(state.services().system().get_usage_refresh_interval())
}

#[tauri::command]
pub(crate) fn set_usage_refresh_interval(
    state: State<'_, TauriAppState>,
    interval: String,
) -> Result<CoreEnvelope<String>, String> {
    respond(
        state
            .services()
            .system()
            .set_usage_refresh_interval(interval),
    )
}

#[tauri::command]
pub(crate) fn run_daemon_once(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<DaemonRunPayload>, String> {
    respond(state.services().daemon().run_once())
}

#[tauri::command]
pub(crate) fn load_pending_auto_switch(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<PendingAutoSwitchStatePayload>, String> {
    respond(state.services().system().load_pending_auto_switch())
}

#[tauri::command]
pub(crate) fn dismiss_pending_auto_switch(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Option<String>>, String> {
    respond(state.services().system().dismiss_pending_auto_switch())
}

#[tauri::command]
pub(crate) fn confirm_pending_auto_switch(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<()>, String> {
    respond(state.services().system().confirm_pending_auto_switch())
}

#[tauri::command]
pub(crate) fn confirm_pending_auto_switch_and_restart_codex(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<()>, String> {
    respond(
        state
            .services()
            .system()
            .confirm_pending_auto_switch_and_restart_application(),
    )
}

#[tauri::command]
pub(crate) fn diagnose(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<DiagnosePayload>, String> {
    respond(state.services().system().diagnose())
}

#[tauri::command]
pub(crate) fn restart_codex(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().restart_application())
}

#[tauri::command]
pub(crate) fn force_kill_codex(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().system().force_kill_application())
}

#[tauri::command]
pub(crate) fn reset_codex_config(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().system().reset_application_config())
}

#[tauri::command]
pub(crate) fn graceful_restart_for_update(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().graceful_restart_for_update())
}

#[tauri::command]
pub(crate) fn check_update_installability(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<UpdateInstallabilityPayload>, String> {
    respond(state.services().system().check_update_installability())
}

#[tauri::command]
pub(crate) fn load_bootstrap_state(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<BootstrapStatePayload>, String> {
    respond(state.services().system().load_bootstrap_state())
}

#[tauri::command]
pub(crate) fn open_path(
    state: State<'_, TauriAppState>,
    path: String,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().open_path(path))
}

#[tauri::command]
pub(crate) fn get_system_info(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<SystemInfo>, String> {
    respond(state.services().system().get_system_info())
}

#[tauri::command]
pub(crate) fn get_device_id(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<String>, String> {
    respond(state.services().system().get_device_id())
}

#[tauri::command]
pub(crate) fn get_or_create_remote_device_secret(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<String>, String> {
    respond(
        state
            .services()
            .system()
            .get_or_create_remote_device_secret(),
    )
}

#[tauri::command]
pub(crate) fn import_remote_device_secret_if_empty(
    state: State<'_, TauriAppState>,
    secret: Option<String>,
) -> Result<CoreEnvelope<()>, String> {
    respond(
        state
            .services()
            .system()
            .import_remote_device_secret_if_empty(secret),
    )
}

#[tauri::command]
pub(crate) fn get_notification_client_state(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<NotificationClientStatePayload>, String> {
    respond(state.services().system().get_notification_client_state())
}

#[tauri::command]
pub(crate) fn get_mystery_unlock_grants(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Vec<MysteryRouteGrant>>, String> {
    respond(state.services().system().get_mystery_unlock_grants())
}

#[tauri::command]
pub(crate) fn merge_mystery_unlock_grants(
    state: State<'_, TauriAppState>,
    grants: Option<Value>,
) -> Result<CoreEnvelope<Vec<MysteryRouteGrant>>, String> {
    respond(
        state
            .services()
            .system()
            .merge_mystery_unlock_grants(grants),
    )
}

#[tauri::command]
pub(crate) fn get_image_compat(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<bool>, String> {
    respond(state.services().system().get_image_compat())
}

#[tauri::command]
pub(crate) fn set_image_compat(
    state: State<'_, TauriAppState>,
    enabled: bool,
) -> Result<CoreEnvelope<bool>, String> {
    respond(state.services().system().set_image_compat(enabled))
}
