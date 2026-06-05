use crate::contracts::{
    CoreEnvelope, CustomInstructionPreviewPayload, CustomInstructionStatePayload,
};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

/// 中文职责说明：自定义指令预览、应用、清理和回滚事务 owner，真实模板写入后续在本边界补齐。
pub(crate) struct CustomInstructionsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> CustomInstructionsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_state(
        &self,
    ) -> Result<CoreEnvelope<CustomInstructionStatePayload>, CoreError> {
        let _ = self.repositories.custom_instructions().source_path();
        Ok(CoreEnvelope::pending(
            CustomInstructionStatePayload::default(),
            "custom_instructions",
        ))
    }

    pub(crate) fn preview_apply(
        &self,
        _template_id: Option<String>,
        content: String,
    ) -> Result<CoreEnvelope<CustomInstructionPreviewPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            CustomInstructionPreviewPayload {
                next_managed_content: content.clone(),
                resulting_content: content,
                ..CustomInstructionPreviewPayload::default()
            },
            "custom_instruction_preview",
        ))
    }

    pub(crate) fn apply(
        &self,
        _template_id: Option<String>,
        _content: String,
    ) -> Result<CoreEnvelope<CustomInstructionStatePayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            CustomInstructionStatePayload::default(),
            "apply_custom_instruction",
        ))
    }

    pub(crate) fn clear_block(
        &self,
    ) -> Result<CoreEnvelope<CustomInstructionStatePayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            CustomInstructionStatePayload::default(),
            "clear_custom_instruction_block",
        ))
    }

    pub(crate) fn rollback(
        &self,
        _history_id: Option<String>,
    ) -> Result<CoreEnvelope<CustomInstructionStatePayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            CustomInstructionStatePayload::default(),
            "rollback_custom_instruction",
        ))
    }
}
