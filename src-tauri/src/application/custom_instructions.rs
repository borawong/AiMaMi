//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::custom_instructions
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{
    stub_warning, CoreEnvelope, CustomInstructionPreviewPayload, CustomInstructionStatePayload,
};

#[derive(Default)]
pub(crate) struct CustomInstructionsService;

impl CustomInstructionsService {
    pub(crate) fn load_state(&self) -> CoreEnvelope<CustomInstructionStatePayload> {
        CoreEnvelope::ok_with_warnings(
            CustomInstructionStatePayload::default(),
            vec![stub_warning("custom_instructions")],
        )
    }

    pub(crate) fn preview_apply(
        &self,
        _template_id: Option<String>,
        content: String,
    ) -> CoreEnvelope<CustomInstructionPreviewPayload> {
        CoreEnvelope::ok_with_warnings(
            CustomInstructionPreviewPayload {
                next_managed_content: content.clone(),
                resulting_content: content,
                ..CustomInstructionPreviewPayload::default()
            },
            vec![stub_warning("custom_instruction_preview")],
        )
    }

    pub(crate) fn apply(
        &self,
        _template_id: Option<String>,
        _content: String,
    ) -> CoreEnvelope<CustomInstructionStatePayload> {
        CoreEnvelope::no_op(
            CustomInstructionStatePayload::default(),
            "apply_custom_instruction",
        )
    }

    pub(crate) fn clear_block(&self) -> CoreEnvelope<CustomInstructionStatePayload> {
        CoreEnvelope::no_op(
            CustomInstructionStatePayload::default(),
            "clear_custom_instruction_block",
        )
    }

    pub(crate) fn rollback(
        &self,
        _history_id: Option<String>,
    ) -> CoreEnvelope<CustomInstructionStatePayload> {
        CoreEnvelope::no_op(
            CustomInstructionStatePayload::default(),
            "rollback_custom_instruction",
        )
    }
}
