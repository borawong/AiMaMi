use crate::application::usecase;
use crate::contracts::{
    CoreEnvelope, SkillBackupListPayload, SkillDeleteBackupPayload, SkillImportPayload,
    SkillListPayload, SkillRemovePayload, SkillRestorePayload,
};
use crate::repository::Repository;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn load_installed_skills(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<SkillListPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::skills::load_installed(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_skill_backups(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<SkillBackupListPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::skills::load_backups(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn import_skill(
    repo: State<'_, Mutex<Repository>>,
    path: String,
) -> Result<CoreEnvelope<SkillImportPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::skills::import_skill(&repo, path)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn remove_skill(
    repo: State<'_, Mutex<Repository>>,
    id: String,
) -> Result<CoreEnvelope<SkillRemovePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::skills::remove_skill(&repo, id)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn restore_skill_backup(
    repo: State<'_, Mutex<Repository>>,
    id: String,
) -> Result<CoreEnvelope<SkillRestorePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::skills::restore_backup(&repo, id)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_skill_backup(
    repo: State<'_, Mutex<Repository>>,
    id: String,
) -> Result<CoreEnvelope<SkillDeleteBackupPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::skills::delete_backup(&repo, id)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}
