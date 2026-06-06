use crate::contracts::{
    BackendSkeletonStatus, CoreEnvelope, CustomInstructionCurrentState,
    CustomInstructionPreviewPayload, CustomInstructionStatePayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

const MODULE: &str = "custom_instructions";

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
        let plan = self.pending_plan("load_custom_instruction_state");
        Ok(CoreEnvelope::from_backend_plan(
            self.state_payload(&plan, None, None, None),
            &plan,
        ))
    }

    pub(crate) fn preview_apply(
        &self,
        content: Option<String>,
    ) -> Result<CoreEnvelope<CustomInstructionPreviewPayload>, CoreError> {
        let content = required_text(
            content.unwrap_or_default(),
            "empty_custom_instruction_content",
            "自定义指令内容不能为空。",
        )?;
        let plan = self.pending_plan("preview_custom_instruction_apply");
        Ok(CoreEnvelope::from_backend_plan(
            CustomInstructionPreviewPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                global_path: self.repositories.custom_instructions().source_path(),
                next_managed_content: content.clone(),
                resulting_content: content,
                ..CustomInstructionPreviewPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn apply(
        &self,
        content: Option<String>,
        source: Option<String>,
        template_code: Option<String>,
        template_title: Option<String>,
    ) -> Result<CoreEnvelope<CustomInstructionStatePayload>, CoreError> {
        let _source = clean_optional_text(source);
        let template_code = clean_optional_text(template_code);
        let template_title = clean_optional_text(template_title);
        let content = required_text(
            content.unwrap_or_default(),
            "empty_custom_instruction_content",
            "自定义指令内容不能为空。",
        )?;
        let plan = self.no_op_plan("apply_custom_instruction");
        Ok(CoreEnvelope::from_backend_plan(
            self.state_payload(&plan, template_code, template_title, Some(content)),
            &plan,
        ))
    }

    pub(crate) fn clear_block(
        &self,
    ) -> Result<CoreEnvelope<CustomInstructionStatePayload>, CoreError> {
        let plan = self.no_op_plan("clear_custom_instruction_block");
        Ok(CoreEnvelope::from_backend_plan(
            self.state_payload(&plan, None, None, None),
            &plan,
        ))
    }

    pub(crate) fn rollback(
        &self,
        history_id: Option<String>,
    ) -> Result<CoreEnvelope<CustomInstructionStatePayload>, CoreError> {
        let _history_id = clean_optional_text(history_id);
        let plan = self.no_op_plan("rollback_custom_instruction");
        Ok(CoreEnvelope::from_backend_plan(
            self.state_payload(&plan, None, None, None),
            &plan,
        ))
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary())
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(
            self.repositories.custom_instructions().source_path(),
        )
    }

    fn state_payload(
        &self,
        plan: &BackendOperationPlan,
        template_code: Option<String>,
        template_title: Option<String>,
        managed_content: Option<String>,
    ) -> CustomInstructionStatePayload {
        CustomInstructionStatePayload {
            status: BackendSkeletonStatus::from_plan(plan),
            current: CustomInstructionCurrentState {
                global_path: self.repositories.custom_instructions().source_path(),
                managed_content: managed_content.unwrap_or_default(),
                last_template_code: template_code,
                last_template_title: template_title,
                ..CustomInstructionCurrentState::default()
            },
            history: Vec::new(),
        }
    }
}

fn required_text(
    value: String,
    code: &'static str,
    public_message: &'static str,
) -> Result<String, CoreError> {
    let value = value.trim().to_owned();
    if value.is_empty() {
        Err(CoreError::domain(code, public_message))
    } else {
        Ok(value)
    }
}

fn clean_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let value = value.trim().to_owned();
        if value.is_empty() {
            None
        } else {
            Some(value)
        }
    })
}
