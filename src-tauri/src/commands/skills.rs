use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{
    CoreEnvelope, SkillBackupListPayload, SkillDeleteBackupPayload, SkillImportPayload,
    SkillListPayload, SkillRemovePayload, SkillRestorePayload,
};
use crate::core::error::CoreError;
use serde::Serialize;
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
    let path = match required_command_text::<SkillImportPayload>(
        path,
        "missing_skill_path",
        "\u{6280}\u{80fd}\u{8def}\u{5f84}\u{4e0d}\u{80fd}\u{4e3a}\u{7a7a}\u{3002}",
    ) {
        Ok(path) => path,
        Err(envelope) => return Ok(envelope),
    };
    respond(state.services().skills().import_skill(path))
}

#[tauri::command]
pub(crate) fn remove_skill(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillRemovePayload>, String> {
    let id = match required_command_text::<SkillRemovePayload>(
        id,
        "missing_skill_id",
        "\u{6280}\u{80fd} ID \u{4e0d}\u{80fd}\u{4e3a}\u{7a7a}\u{3002}",
    ) {
        Ok(id) => id,
        Err(envelope) => return Ok(envelope),
    };
    respond(state.services().skills().remove_skill(id))
}

#[tauri::command]
pub(crate) fn restore_skill_backup(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillRestorePayload>, String> {
    let id = match required_command_text::<SkillRestorePayload>(
        id,
        "missing_skill_id",
        "\u{6280}\u{80fd} ID \u{4e0d}\u{80fd}\u{4e3a}\u{7a7a}\u{3002}",
    ) {
        Ok(id) => id,
        Err(envelope) => return Ok(envelope),
    };
    respond(state.services().skills().restore_skill_backup(id))
}

#[tauri::command]
pub(crate) fn delete_skill_backup(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<SkillDeleteBackupPayload>, String> {
    let id = match required_command_text::<SkillDeleteBackupPayload>(
        id,
        "missing_skill_id",
        "\u{6280}\u{80fd} ID \u{4e0d}\u{80fd}\u{4e3a}\u{7a7a}\u{3002}",
    ) {
        Ok(id) => id,
        Err(envelope) => return Ok(envelope),
    };
    respond(state.services().skills().delete_skill_backup(id))
}

fn required_command_text<T>(
    value: Option<String>,
    code: &'static str,
    public_message: &'static str,
) -> Result<String, CoreEnvelope<T>>
where
    T: Serialize + Default,
{
    let Some(value) = value else {
        let error = CoreError::domain(code, public_message);
        return Err(CoreEnvelope::failure(T::default(), &error));
    };

    let value = value.trim().to_owned();
    if value.is_empty() {
        let error = CoreError::domain(code, public_message);
        Err(CoreEnvelope::failure(T::default(), &error))
    } else {
        Ok(value)
    }
}
