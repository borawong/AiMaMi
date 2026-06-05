use crate::contracts::{
    CoreEnvelope, InstalledSkillSummary, SkillBackupListPayload, SkillBackupSummary,
    SkillDeleteBackupPayload, SkillImportPayload, SkillListPayload, SkillRemovePayload,
    SkillRestorePayload,
};
use crate::core::{dto, error::CoreError};
use crate::repository::RepositoryBundle;

/// 中文职责说明：技能安装、备份、恢复和删除事务 owner，真实文件变更后续只能在本边界补齐。
pub(crate) struct SkillsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> SkillsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_installed(&self) -> Result<CoreEnvelope<SkillListPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            SkillListPayload {
                root_path: self.repositories.skills().root_path(),
                ..SkillListPayload::default()
            },
            "skills",
        ))
    }

    pub(crate) fn load_backups(&self) -> Result<CoreEnvelope<SkillBackupListPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            SkillBackupListPayload {
                root_path: self.repositories.skills().backup_root_path(),
                ..SkillBackupListPayload::default()
            },
            "skill_backups",
        ))
    }

    pub(crate) fn import_skill(
        &self,
        source_path: String,
    ) -> Result<CoreEnvelope<SkillImportPayload>, CoreError> {
        let name = dto::name_from_path(&source_path).unwrap_or_else(|| "skill".into());
        Ok(CoreEnvelope::no_op(
            SkillImportPayload {
                skill: skill_from_name(name),
                replaced_existing: false,
                backup: None,
            },
            "import_skill",
        ))
    }

    pub(crate) fn remove_skill(
        &self,
        name: String,
    ) -> Result<CoreEnvelope<SkillRemovePayload>, CoreError> {
        let name = require_name(name)?;
        Ok(CoreEnvelope::no_op(
            SkillRemovePayload {
                removed_skill_id: name.clone(),
                backup: backup_from_name(name),
                remaining_installed_count: 0,
            },
            "remove_skill",
        ))
    }

    pub(crate) fn restore_skill_backup(
        &self,
        name: String,
    ) -> Result<CoreEnvelope<SkillRestorePayload>, CoreError> {
        let name = require_name(name)?;
        Ok(CoreEnvelope::no_op(
            SkillRestorePayload {
                restored_skill: skill_from_name(name.clone()),
                backup: backup_from_name(name),
                rollback_backup: None,
            },
            "restore_skill_backup",
        ))
    }

    pub(crate) fn delete_skill_backup(
        &self,
        name: String,
    ) -> Result<CoreEnvelope<SkillDeleteBackupPayload>, CoreError> {
        let name = require_name(name)?;
        Ok(CoreEnvelope::no_op(
            SkillDeleteBackupPayload {
                deleted_backup_id: name,
                remaining_backup_count: 0,
            },
            "delete_skill_backup",
        ))
    }
}

fn require_name(name: String) -> Result<String, CoreError> {
    if name.trim().is_empty() {
        Err(CoreError::domain("empty_skill_name", "技能名称不能为空。"))
    } else {
        Ok(name)
    }
}

fn skill_from_name(name: String) -> InstalledSkillSummary {
    InstalledSkillSummary {
        id: name.clone(),
        name,
        ..InstalledSkillSummary::default()
    }
}

fn backup_from_name(name: String) -> SkillBackupSummary {
    SkillBackupSummary {
        id: name.clone(),
        skill_id: name.clone(),
        name,
        ..SkillBackupSummary::default()
    }
}
