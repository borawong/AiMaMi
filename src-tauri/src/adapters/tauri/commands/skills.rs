//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::commands::skills
//! Current role: Tauri command adapter
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::application::BackendServices;
use crate::contracts::{
    CoreEnvelope, SkillBackupListPayload, SkillDeleteBackupPayload, SkillImportPayload,
    SkillListPayload, SkillRemovePayload, SkillRestorePayload,
};
use tauri::State;

#[tauri::command]
pub(crate) fn load_installed_skills(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<SkillListPayload>, String> {
    Ok(services.skills().load_installed())
}

#[tauri::command]
pub(crate) fn load_skill_backups(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<SkillBackupListPayload>, String> {
    Ok(services.skills().load_backups())
}

#[tauri::command]
pub(crate) fn import_skill(
    services: State<'_, BackendServices>,
    source_path: Option<String>,
    path: Option<String>,
) -> Result<CoreEnvelope<SkillImportPayload>, String> {
    Ok(services
        .skills()
        .import_skill(source_path.or(path).unwrap_or_default()))
}

#[tauri::command]
pub(crate) fn remove_skill(
    services: State<'_, BackendServices>,
    name: Option<String>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillRemovePayload>, String> {
    Ok(services
        .skills()
        .remove_skill(name.or(id).unwrap_or_else(|| "stub-skill".into())))
}

#[tauri::command]
pub(crate) fn restore_skill_backup(
    services: State<'_, BackendServices>,
    name: Option<String>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillRestorePayload>, String> {
    Ok(services
        .skills()
        .restore_skill_backup(name.or(id).unwrap_or_else(|| "stub-skill".into())))
}

#[tauri::command]
pub(crate) fn delete_skill_backup(
    services: State<'_, BackendServices>,
    name: Option<String>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillDeleteBackupPayload>, String> {
    Ok(services
        .skills()
        .delete_skill_backup(name.or(id).unwrap_or_else(|| "stub-skill".into())))
}
