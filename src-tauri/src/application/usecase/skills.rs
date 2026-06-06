use crate::contracts::{
    BackendSkeletonStatus, CoreEnvelope, InstalledSkillSummary, SkillBackupListPayload,
    SkillBackupSummary, SkillDeleteBackupPayload, SkillImportPayload, SkillListPayload,
    SkillRemovePayload, SkillRestorePayload,
};
use crate::core::dto::{self, BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

const MODULE: &str = "skills";

/// 中文职责说明：技能安装、备份、恢复和删除事务 owner，真实文件变更后续只能在本边界补齐。
pub(crate) struct SkillsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> SkillsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_installed(&self) -> Result<CoreEnvelope<SkillListPayload>, CoreError> {
        let root_path = self.repositories.skills().root_path();
        let plan = self.pending_plan("load_installed_skills", root_path.clone());
        Ok(CoreEnvelope::from_backend_plan(
            SkillListPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                root_path,
                ..SkillListPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn load_backups(&self) -> Result<CoreEnvelope<SkillBackupListPayload>, CoreError> {
        let root_path = self.repositories.skills().backup_root_path();
        let plan = self.pending_plan("load_skill_backups", root_path.clone());
        Ok(CoreEnvelope::from_backend_plan(
            SkillBackupListPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                root_path,
                ..SkillBackupListPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn import_skill(
        &self,
        source_path: String,
    ) -> Result<CoreEnvelope<SkillImportPayload>, CoreError> {
        let source_path = required_text(
            source_path,
            "empty_skill_source_path",
            "技能来源路径不能为空。",
        )?;
        let name = dto::name_from_path(&source_path)
            .ok_or_else(|| CoreError::domain("empty_skill_name", "技能名称不能为空。"))?;
        let plan = self.no_op_plan("import_skill", self.repositories.skills().root_path());
        Ok(CoreEnvelope::from_backend_plan(
            SkillImportPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                skill: skill_from_name(name),
                replaced_existing: false,
                backup: None,
            },
            &plan,
        ))
    }

    pub(crate) fn remove_skill(
        &self,
        name: String,
    ) -> Result<CoreEnvelope<SkillRemovePayload>, CoreError> {
        let name = require_name(name)?;
        let plan = self.no_op_plan("remove_skill", self.repositories.skills().root_path());
        Ok(CoreEnvelope::from_backend_plan(
            SkillRemovePayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                removed_skill_id: name.clone(),
                backup: backup_from_name(name),
                remaining_installed_count: 0,
            },
            &plan,
        ))
    }

    pub(crate) fn restore_skill_backup(
        &self,
        name: String,
    ) -> Result<CoreEnvelope<SkillRestorePayload>, CoreError> {
        let name = require_name(name)?;
        let plan = self.no_op_plan(
            "restore_skill_backup",
            self.repositories.skills().backup_root_path(),
        );
        Ok(CoreEnvelope::from_backend_plan(
            SkillRestorePayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                restored_skill: skill_from_name(name.clone()),
                backup: backup_from_name(name),
                rollback_backup: None,
            },
            &plan,
        ))
    }

    pub(crate) fn delete_skill_backup(
        &self,
        name: String,
    ) -> Result<CoreEnvelope<SkillDeleteBackupPayload>, CoreError> {
        let name = require_name(name)?;
        let plan = self.no_op_plan(
            "delete_skill_backup",
            self.repositories.skills().backup_root_path(),
        );
        Ok(CoreEnvelope::from_backend_plan(
            SkillDeleteBackupPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                deleted_backup_id: name,
                remaining_backup_count: 0,
            },
            &plan,
        ))
    }

    fn pending_plan(&self, command: &'static str, source_path: String) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary(source_path))
    }

    fn no_op_plan(&self, command: &'static str, source_path: String) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary(source_path))
    }

    fn repository_boundary(&self, source_path: String) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(source_path)
    }
}

fn require_name(name: String) -> Result<String, CoreError> {
    required_text(name, "empty_skill_name", "技能名称不能为空。")
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
