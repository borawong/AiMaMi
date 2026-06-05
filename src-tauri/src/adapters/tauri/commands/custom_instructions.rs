//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::commands::custom_instructions
//! Current role: Tauri command adapter
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::application::BackendServices;
use crate::contracts::{
    CoreEnvelope, CustomInstructionPreviewPayload, CustomInstructionStatePayload,
};
use tauri::State;

#[tauri::command]
pub(crate) fn load_custom_instruction_state(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    Ok(services.custom_instructions().load_state())
}

#[tauri::command]
pub(crate) fn preview_custom_instruction_apply(
    services: State<'_, BackendServices>,
    template_id: Option<String>,
    content: Option<String>,
) -> Result<CoreEnvelope<CustomInstructionPreviewPayload>, String> {
    Ok(services
        .custom_instructions()
        .preview_apply(template_id, content.unwrap_or_default()))
}

#[tauri::command]
pub(crate) fn apply_custom_instruction(
    services: State<'_, BackendServices>,
    template_id: Option<String>,
    content: Option<String>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    Ok(services
        .custom_instructions()
        .apply(template_id, content.unwrap_or_default()))
}

#[tauri::command]
pub(crate) fn clear_custom_instruction_block(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    Ok(services.custom_instructions().clear_block())
}

#[tauri::command]
pub(crate) fn rollback_custom_instruction(
    services: State<'_, BackendServices>,
    history_id: Option<String>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    Ok(services.custom_instructions().rollback(history_id))
}
