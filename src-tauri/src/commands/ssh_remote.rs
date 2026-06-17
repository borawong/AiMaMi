use crate::core::models::{
    CoreEnvelope, SshConnectionTestPayload, SshServerConfig, SshServerListPayload,
    SshServerSummary, SshSyncPayload,
};
use crate::core::repository::Repository;
use crate::core::ssh_remote;
use std::sync::Mutex;
use tauri::{async_runtime, AppHandle, Manager, State};

#[tauri::command]
pub fn load_ssh_servers(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<SshServerListPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    ssh_remote::load_servers(repo.paths())
        .map(CoreEnvelope::ok)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn upsert_ssh_server(
    repo: State<'_, Mutex<Repository>>,
    id: Option<String>,
    config: SshServerConfig,
) -> Result<CoreEnvelope<SshServerSummary>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    ssh_remote::upsert_server(repo.paths(), id, config)
        .map(CoreEnvelope::ok)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_ssh_server(
    repo: State<'_, Mutex<Repository>>,
    id: String,
) -> Result<CoreEnvelope<SshServerSummary>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    ssh_remote::remove_server(repo.paths(), &id)
        .map(CoreEnvelope::ok)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_ssh_server(
    app: AppHandle,
    id: Option<String>,
    config: Option<SshServerConfig>,
) -> Result<CoreEnvelope<SshConnectionTestPayload>, String> {
    async_runtime::spawn_blocking(move || {
        let repo_state = app.state::<Mutex<Repository>>();
        let repo = repo_state.lock().map_err(|e| e.to_string())?;
        ssh_remote::test_server(repo.paths(), id.as_deref(), config)
            .map(CoreEnvelope::ok)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("Blocking command task failed: {e}"))?
}

#[tauri::command]
pub async fn sync_ssh_server(
    app: AppHandle,
    id: String,
) -> Result<CoreEnvelope<SshSyncPayload>, String> {
    async_runtime::spawn_blocking(move || {
        let repo_state = app.state::<Mutex<Repository>>();
        let repo = repo_state.lock().map_err(|e| e.to_string())?;
        ssh_remote::sync_server(repo.paths(), &id)
            .map(CoreEnvelope::ok)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("Blocking command task failed: {e}"))?
}

#[tauri::command]
pub async fn sync_all_ssh_servers(app: AppHandle) -> Result<CoreEnvelope<SshSyncPayload>, String> {
    async_runtime::spawn_blocking(move || {
        let repo_state = app.state::<Mutex<Repository>>();
        let repo = repo_state.lock().map_err(|e| e.to_string())?;
        ssh_remote::sync_all_enabled(repo.paths())
            .map(CoreEnvelope::ok)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("Blocking command task failed: {e}"))?
}

#[tauri::command]
pub fn open_ssh_server(repo: State<'_, Mutex<Repository>>, id: String) -> Result<(), String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    ssh_remote::open_server(repo.paths(), &id).map_err(|e| e.to_string())
}
