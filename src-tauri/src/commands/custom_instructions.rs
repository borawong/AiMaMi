use crate::core::custom_instructions;
use crate::core::models::{
    CoreEnvelope, CustomInstructionPreviewPayload, CustomInstructionStatePayload,
};
use crate::core::repository::Repository;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn load_custom_instruction_state(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let payload = custom_instructions::load_state(repo.paths()).map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn preview_custom_instruction_apply(
    repo: State<'_, Mutex<Repository>>,
    content: String,
) -> Result<CoreEnvelope<CustomInstructionPreviewPayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let payload =
        custom_instructions::preview_apply(repo.paths(), &content).map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn apply_custom_instruction(
    repo: State<'_, Mutex<Repository>>,
    content: String,
    template_code: Option<String>,
    template_title: Option<String>,
    source: Option<String>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let payload = custom_instructions::apply_managed_content(
        repo.paths(),
        &content,
        template_code,
        template_title,
        source,
    )
    .map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn clear_custom_instruction_block(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let payload =
        custom_instructions::clear_managed_block(repo.paths()).map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}

#[tauri::command]
pub fn rollback_custom_instruction(
    repo: State<'_, Mutex<Repository>>,
    history_id: String,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    let payload = custom_instructions::rollback_history(repo.paths(), &history_id)
        .map_err(|e| e.to_string())?;
    Ok(CoreEnvelope::ok(payload))
}
