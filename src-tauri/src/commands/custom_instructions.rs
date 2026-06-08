use crate::application::usecase;
use crate::contracts::{
    CoreEnvelope, CustomInstructionPreviewPayload, CustomInstructionStatePayload,
};
use crate::repository::Repository;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn load_custom_instruction_state(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::custom_instructions::load_state(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn preview_custom_instruction_apply(
    repo: State<'_, Mutex<Repository>>,
    content: String,
) -> Result<CoreEnvelope<CustomInstructionPreviewPayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::custom_instructions::preview_apply(&repo, content)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn apply_custom_instruction(
    repo: State<'_, Mutex<Repository>>,
    content: String,
    template_code: Option<String>,
    template_title: Option<String>,
    source: Option<String>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::custom_instructions::apply(&repo, content, template_code, template_title, source)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn clear_custom_instruction_block(
    repo: State<'_, Mutex<Repository>>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::custom_instructions::clear_block(&repo)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn rollback_custom_instruction(
    repo: State<'_, Mutex<Repository>>,
    history_id: String,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    let repo = repo.lock().map_err(|error| error.to_string())?;
    usecase::custom_instructions::rollback(&repo, history_id)
        .map(CoreEnvelope::ok)
        .map_err(|error| error.to_string())
}
