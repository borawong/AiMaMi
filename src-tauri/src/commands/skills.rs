use crate::core::auth::current_timestamp;
use crate::core::models::*;
use crate::core::repository::Repository;
use crate::core::skills;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn load_installed_skills(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<SkillListPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let items = skills::load_installed_skills(&paths.skills_dir).map_err(|e| e.to_string())?;
    let payload = SkillListPayload {
        total: items.len() as i32,
        root_path: paths.skills_dir.display().to_string(),
        last_scan_at: current_timestamp(),
        items,
    };
    let _ = repo.store_bootstrap_installed_skills(&payload);
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn load_skill_backups(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<SkillBackupListPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let items = skills::load_skill_backups(&paths.skill_backups_dir).map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(SkillBackupListPayload {
        total: items.len() as i32,
        root_path: paths.skill_backups_dir.display().to_string(),
        last_scan_at: current_timestamp(),
        items,
    }))
}

#[tauri::command]
pub fn import_skill(
    repo: State<'_, Mutex<Repository>>,
    path: String,
) -> Result<CoreEnvelope<SkillImportPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let payload = skills::import_skill(&paths.skills_dir, &paths.codexmate_dir, &path)
        .map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn remove_skill(
    repo: State<'_, Mutex<Repository>>,
    id: String,
) -> Result<CoreEnvelope<SkillRemovePayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let payload = skills::remove_skill(&paths.skills_dir, &paths.codexmate_dir, &id)
        .map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn restore_skill_backup(
    repo: State<'_, Mutex<Repository>>,
    id: String,
) -> Result<CoreEnvelope<SkillRestorePayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let payload = skills::restore_skill_backup(&paths.skills_dir, &paths.codexmate_dir, &id)
        .map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn delete_skill_backup(
    repo: State<'_, Mutex<Repository>>,
    id: String,
) -> Result<CoreEnvelope<SkillDeleteBackupPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let paths = repo.paths();
    let payload =
        skills::delete_skill_backup(&paths.codexmate_dir, &id).map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}
