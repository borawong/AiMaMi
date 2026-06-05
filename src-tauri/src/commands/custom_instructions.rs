use crate::adapters::tauri::state::TauriAppState;
use crate::commands::respond;
use crate::contracts::{
    CoreEnvelope, CustomInstructionPreviewPayload, CustomInstructionStatePayload,
};
use tauri::State;

#[tauri::command]
pub(crate) fn load_custom_instruction_state(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    respond(state.services().custom_instructions().load_state())
}

#[tauri::command]
pub(crate) fn preview_custom_instruction_apply(
    state: State<'_, TauriAppState>,
    template_id: Option<String>,
    content: Option<String>,
) -> Result<CoreEnvelope<CustomInstructionPreviewPayload>, String> {
    respond(
        state
            .services()
            .custom_instructions()
            .preview_apply(template_id, content.unwrap_or_default()),
    )
}

#[tauri::command]
pub(crate) fn apply_custom_instruction(
    state: State<'_, TauriAppState>,
    template_id: Option<String>,
    content: Option<String>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    respond(
        state
            .services()
            .custom_instructions()
            .apply(template_id, content.unwrap_or_default()),
    )
}

#[tauri::command]
pub(crate) fn clear_custom_instruction_block(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    respond(state.services().custom_instructions().clear_block())
}

#[tauri::command]
pub(crate) fn rollback_custom_instruction(
    state: State<'_, TauriAppState>,
    history_id: Option<String>,
) -> Result<CoreEnvelope<CustomInstructionStatePayload>, String> {
    respond(state.services().custom_instructions().rollback(history_id))
}
