use crate::application::usecase;
use crate::contracts::{
    ApiModePayload, ApiProxyDetectPayload, ApiProxyMode, ApiProxyTestPayload,
    AutoSwitchConfigPayload, BootstrapStatePayload, CleanPayload, CoreEnvelope,
    CoreSnapshotPayload, DaemonRunPayload, DiagnosePayload, MysteryRouteGrant,
    NotificationClientStatePayload, RebuildRegistryPayload, SystemActionPayload, SystemInfoPayload,
    UpdateInstallabilityPayload,
};
use crate::repository::Repository;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn load_snapshot(
    repo: State<'_, Mutex<Repository>>,
    local_only: Option<bool>,
) -> Result<CoreEnvelope<CoreSnapshotPayload>, String> {
    let _ = local_only;
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::load_snapshot(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn refresh_usage_snapshot(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<CoreSnapshotPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::refresh_usage_snapshot(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_bootstrap_state(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<BootstrapStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::load_bootstrap_state(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn clean(repo: State<'_, Mutex<Repository>>) -> Result<CoreEnvelope<CleanPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::clean(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn rebuild_registry(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<RebuildRegistryPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::rebuild_registry(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn diagnose(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<DiagnosePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::diagnose(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_auto_switch(
    repo: State<'_, Mutex<Repository>>,
    enabled: bool,
) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::set_auto_switch(&repo, enabled)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn configure_auto_switch(
    repo: State<'_, Mutex<Repository>>,
    threshold_5h_percent: Option<i32>,
    threshold_weekly_percent: Option<i32>,
) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::configure_auto_switch(&repo, threshold_5h_percent, threshold_weekly_percent)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_api_proxy_config(
    repo: State<'_, Mutex<Repository>>,
    mode: ApiProxyMode,
    url: Option<String>,
) -> Result<CoreEnvelope<ApiModePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::set_api_proxy_config(&repo, mode, url)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn test_api_proxy_config(
    mode: ApiProxyMode,
    url: Option<String>,
) -> Result<CoreEnvelope<ApiProxyTestPayload>, String> {
    Ok(CoreEnvelope::ok(usecase::system::test_api_proxy_config(
        mode, url,
    )))
}

#[tauri::command]
pub fn detect_api_proxy_config() -> Result<CoreEnvelope<ApiProxyDetectPayload>, String> {
    Ok(CoreEnvelope::ok(usecase::system::detect_api_proxy_config()))
}

#[tauri::command]
pub fn run_daemon_once(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<DaemonRunPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::run_daemon_once(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_usage_refresh_interval(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<String>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::get_usage_refresh_interval(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_usage_refresh_interval(
    repo: State<'_, Mutex<Repository>>,
    interval: String,
) -> Result<CoreEnvelope<String>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::set_usage_refresh_interval(&repo, interval)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn check_update_installability() -> Result<CoreEnvelope<UpdateInstallabilityPayload>, String> {
    Ok(CoreEnvelope::ok(
        usecase::system::check_update_installability(),
    ))
}

#[tauri::command]
pub fn graceful_restart_for_update() -> Result<CoreEnvelope<SystemActionPayload>, String> {
    Ok(CoreEnvelope::ok(
        usecase::system::graceful_restart_for_update(),
    ))
}

#[tauri::command]
pub fn restart_codex() -> Result<CoreEnvelope<SystemActionPayload>, String> {
    Ok(CoreEnvelope::ok(usecase::system::restart_app()))
}

#[tauri::command]
pub fn force_kill_codex() -> Result<CoreEnvelope<SystemActionPayload>, String> {
    Ok(CoreEnvelope::ok(usecase::system::force_kill_app()))
}

#[tauri::command]
pub fn reset_codex_config() -> Result<CoreEnvelope<SystemActionPayload>, String> {
    Ok(CoreEnvelope::ok(usecase::system::reset_config()))
}

#[tauri::command]
pub fn open_path(path: String) -> Result<CoreEnvelope<SystemActionPayload>, String> {
    usecase::system::open_path(path)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_system_info() -> Result<CoreEnvelope<SystemInfoPayload>, String> {
    Ok(CoreEnvelope::ok(usecase::system::system_info()))
}

#[tauri::command]
pub fn focus_main_window(
    app: tauri::AppHandle,
) -> Result<CoreEnvelope<SystemActionPayload>, String> {
    let window = crate::platform::window::TauriWindowPort::new(&app);
    usecase::system::focus_main_window(&window)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_device_id(repo: State<'_, Mutex<Repository>>) -> Result<CoreEnvelope<String>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::get_device_id(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_notification_client_state(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<NotificationClientStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::notification_client_state(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_mystery_unlock_grants() -> Result<CoreEnvelope<Vec<MysteryRouteGrant>>, String> {
    Ok(CoreEnvelope::ok(usecase::system::mystery_unlock_grants()))
}

#[tauri::command]
pub fn merge_mystery_unlock_grants(
    grants: Vec<MysteryRouteGrant>,
) -> Result<CoreEnvelope<Vec<MysteryRouteGrant>>, String> {
    Ok(CoreEnvelope::ok(
        usecase::system::merge_mystery_unlock_grants(grants),
    ))
}

#[tauri::command]
pub fn get_or_create_remote_device_secret(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<String>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::get_device_id(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn import_remote_device_secret_if_empty(secret: String) -> Result<CoreEnvelope<()>, String> {
    usecase::system::import_remote_device_secret_if_empty(secret);
    Ok(CoreEnvelope::ok(()))
}

#[tauri::command]
pub fn load_pending_auto_switch() -> Result<CoreEnvelope<serde_json::Value>, String> {
    Ok(CoreEnvelope::ok(serde_json::Value::Null))
}

#[tauri::command]
pub fn dismiss_pending_auto_switch() -> Result<CoreEnvelope<Option<String>>, String> {
    Ok(CoreEnvelope::ok(None))
}

#[tauri::command]
pub fn confirm_pending_auto_switch() -> Result<CoreEnvelope<()>, String> {
    Ok(CoreEnvelope::ok(()))
}

#[tauri::command]
pub fn confirm_pending_auto_switch_and_restart_codex() -> Result<CoreEnvelope<()>, String> {
    Ok(CoreEnvelope::ok(()))
}

#[tauri::command]
pub fn has_notch() -> Result<CoreEnvelope<bool>, String> {
    Ok(CoreEnvelope::ok(usecase::system::has_notch()))
}

#[tauri::command]
pub fn get_hotspot_enabled(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<bool>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::get_hotspot_enabled(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_hotspot_enabled(
    repo: State<'_, Mutex<Repository>>,
    enabled: bool,
) -> Result<CoreEnvelope<bool>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::system::set_hotspot_enabled(&repo, enabled)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn hotspot_ready() -> Result<CoreEnvelope<bool>, String> {
    Ok(CoreEnvelope::ok(true))
}

#[tauri::command]
pub fn get_image_compat() -> Result<CoreEnvelope<bool>, String> {
    Ok(CoreEnvelope::ok(usecase::system::get_image_compat()))
}

#[tauri::command]
pub fn set_image_compat(enabled: bool) -> Result<CoreEnvelope<bool>, String> {
    Ok(CoreEnvelope::ok(usecase::system::set_image_compat(enabled)))
}
