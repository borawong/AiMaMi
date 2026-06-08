use crate::application::service::{current_timestamp, restored_status};
use crate::contracts::{
    BackendEffect, SkillBackupListPayload, SkillDeleteBackupPayload, SkillImportPayload,
    SkillListPayload, SkillRemovePayload, SkillRestorePayload,
};
use crate::core::error::CoreError;
use crate::repository::{skills, Repository};

pub fn load_installed(repo: &Repository) -> Result<SkillListPayload, CoreError> {
    let items = skills::load_installed(repo.fs(), &repo.paths().skills_dir)?;
    Ok(SkillListPayload {
        status: restored_status("skills", "load_installed_skills", BackendEffect::NoOp),
        total: items.len() as i32,
        root_path: repo.paths().skills_dir.display().to_string(),
        last_scan_at: current_timestamp(),
        items,
    })
}

pub fn load_backups(repo: &Repository) -> Result<SkillBackupListPayload, CoreError> {
    let items = skills::load_backups(repo.fs(), &repo.paths().skill_backups_dir)?;
    Ok(SkillBackupListPayload {
        status: restored_status("skills", "load_skill_backups", BackendEffect::NoOp),
        total: items.len() as i32,
        root_path: repo.paths().skill_backups_dir.display().to_string(),
        last_scan_at: current_timestamp(),
        items,
    })
}

pub fn import_skill(repo: &Repository, path: String) -> Result<SkillImportPayload, CoreError> {
    let (skill, replaced_existing, backup) = skills::import_skill(
        repo.fs(),
        &repo.paths().skills_dir,
        &repo.paths().app_data_dir,
        &path,
    )?;
    Ok(SkillImportPayload {
        status: restored_status("skills", "import_skill", BackendEffect::NoOp),
        skill,
        replaced_existing,
        backup,
    })
}

pub fn remove_skill(repo: &Repository, id: String) -> Result<SkillRemovePayload, CoreError> {
    let (backup, remaining_installed_count) = skills::remove_skill(
        repo.fs(),
        &repo.paths().skills_dir,
        &repo.paths().app_data_dir,
        &id,
    )?;
    Ok(SkillRemovePayload {
        status: restored_status("skills", "remove_skill", BackendEffect::NoOp),
        removed_skill_id: id,
        backup,
        remaining_installed_count,
    })
}

pub fn restore_backup(repo: &Repository, id: String) -> Result<SkillRestorePayload, CoreError> {
    let (restored_skill, backup, rollback_backup) = skills::restore_backup(
        repo.fs(),
        &repo.paths().skills_dir,
        &repo.paths().app_data_dir,
        &id,
    )?;
    Ok(SkillRestorePayload {
        status: restored_status("skills", "restore_skill_backup", BackendEffect::NoOp),
        restored_skill,
        backup,
        rollback_backup,
    })
}

pub fn delete_backup(repo: &Repository, id: String) -> Result<SkillDeleteBackupPayload, CoreError> {
    let remaining_backup_count = skills::delete_backup(repo.fs(), &repo.paths().app_data_dir, &id)?;
    Ok(SkillDeleteBackupPayload {
        status: restored_status("skills", "delete_skill_backup", BackendEffect::NoOp),
        deleted_backup_id: id,
        remaining_backup_count,
    })
}
