use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{
    CoreEnvelope, SkillBackupListPayload, SkillDeleteBackupPayload, SkillImportPayload,
    SkillListPayload, SkillRemovePayload, SkillRestorePayload,
};
use tauri::State;

#[tauri::command]
pub(crate) fn load_installed_skills(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<SkillListPayload>, String> {
    respond(state.services().skills().load_installed())
}

#[tauri::command]
pub(crate) fn load_skill_backups(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<SkillBackupListPayload>, String> {
    respond(state.services().skills().load_backups())
}

#[tauri::command]
pub(crate) fn import_skill(
    state: State<'_, TauriAppState>,
    path: Option<String>,
) -> Result<CoreEnvelope<SkillImportPayload>, String> {
    respond(
        state
            .services()
            .skills()
            .import_skill(path.unwrap_or_default()),
    )
}

#[tauri::command]
pub(crate) fn remove_skill(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillRemovePayload>, String> {
    respond(
        state
            .services()
            .skills()
            .remove_skill(id.unwrap_or_default()),
    )
}

#[tauri::command]
pub(crate) fn restore_skill_backup(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillRestorePayload>, String> {
    respond(
        state
            .services()
            .skills()
            .restore_skill_backup(id.unwrap_or_default()),
    )
}

#[tauri::command]
pub(crate) fn delete_skill_backup(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillDeleteBackupPayload>, String> {
    respond(
        state
            .services()
            .skills()
            .delete_skill_backup(id.unwrap_or_default()),
    )
}
