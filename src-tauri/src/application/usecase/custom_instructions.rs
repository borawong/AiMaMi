use crate::contracts::{CustomInstructionPreviewPayload, CustomInstructionStatePayload};
use crate::core::error::CoreError;
use crate::repository::{custom_instructions, Repository};

pub fn load_state(repo: &Repository) -> Result<CustomInstructionStatePayload, CoreError> {
    custom_instructions::load_state(repo.fs(), repo.paths())
}

pub fn preview_apply(
    repo: &Repository,
    content: String,
) -> Result<CustomInstructionPreviewPayload, CoreError> {
    custom_instructions::preview_apply(repo.fs(), repo.paths(), &content)
}

pub fn apply(
    repo: &Repository,
    content: String,
    template_code: Option<String>,
    template_title: Option<String>,
    source: Option<String>,
) -> Result<CustomInstructionStatePayload, CoreError> {
    custom_instructions::apply_managed_content(
        repo.fs(),
        repo.paths(),
        &content,
        template_code,
        template_title,
        source,
    )
}

pub fn clear_block(repo: &Repository) -> Result<CustomInstructionStatePayload, CoreError> {
    custom_instructions::clear_managed_block(repo.fs(), repo.paths())
}

pub fn rollback(
    repo: &Repository,
    history_id: String,
) -> Result<CustomInstructionStatePayload, CoreError> {
    custom_instructions::rollback_history(repo.fs(), repo.paths(), &history_id)
}
