//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::skills
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{
    stub_warning, CoreEnvelope, InstalledSkillSummary, SkillBackupListPayload, SkillBackupSummary,
    SkillDeleteBackupPayload, SkillImportPayload, SkillListPayload, SkillRemovePayload,
    SkillRestorePayload,
};

#[derive(Default)]
pub(crate) struct SkillsService;

impl SkillsService {
    pub(crate) fn load_installed(&self) -> CoreEnvelope<SkillListPayload> {
        CoreEnvelope::ok_with_warnings(SkillListPayload::default(), vec![stub_warning("skills")])
    }

    pub(crate) fn load_backups(&self) -> CoreEnvelope<SkillBackupListPayload> {
        CoreEnvelope::ok_with_warnings(
            SkillBackupListPayload::default(),
            vec![stub_warning("skill_backups")],
        )
    }

    pub(crate) fn import_skill(&self, source_path: String) -> CoreEnvelope<SkillImportPayload> {
        CoreEnvelope::no_op(
            SkillImportPayload {
                skill: skill_from_name(name_from_path(&source_path)),
                replaced_existing: false,
                backup: None,
            },
            "import_skill",
        )
    }

    pub(crate) fn remove_skill(&self, name: String) -> CoreEnvelope<SkillRemovePayload> {
        CoreEnvelope::no_op(
            SkillRemovePayload {
                removed_skill_id: name.clone(),
                backup: backup_from_name(name),
                remaining_installed_count: 0,
            },
            "remove_skill",
        )
    }

    pub(crate) fn restore_skill_backup(&self, name: String) -> CoreEnvelope<SkillRestorePayload> {
        CoreEnvelope::no_op(
            SkillRestorePayload {
                restored_skill: skill_from_name(name.clone()),
                backup: backup_from_name(name),
                rollback_backup: None,
            },
            "restore_skill_backup",
        )
    }

    pub(crate) fn delete_skill_backup(
        &self,
        name: String,
    ) -> CoreEnvelope<SkillDeleteBackupPayload> {
        CoreEnvelope::no_op(
            SkillDeleteBackupPayload {
                deleted_backup_id: name,
                remaining_backup_count: 0,
            },
            "delete_skill_backup",
        )
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

fn name_from_path(source_path: &str) -> String {
    source_path
        .rsplit(['/', '\\'])
        .next()
        .filter(|value| !value.is_empty())
        .unwrap_or("stub-skill")
        .to_owned()
}
