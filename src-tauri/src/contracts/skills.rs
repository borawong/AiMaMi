use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct InstalledSkillSummary {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub summary: Option<String>,
    pub relative_path: String,
    pub directory_path: String,
    pub skill_file_path: String,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillListPayload {
    pub status: BackendSkeletonStatus,
    pub items: Vec<InstalledSkillSummary>,
    pub total: i32,
    pub root_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SkillBackupSummary {
    pub id: String,
    #[serde(rename = "skillID")]
    pub skill_id: String,
    pub name: String,
    pub title: Option<String>,
    pub relative_path: String,
    pub backup_path: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillBackupListPayload {
    pub status: BackendSkeletonStatus,
    pub items: Vec<SkillBackupSummary>,
    pub total: i32,
    pub root_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillImportPayload {
    pub status: BackendSkeletonStatus,
    pub skill: InstalledSkillSummary,
    pub replaced_existing: bool,
    pub backup: Option<SkillBackupSummary>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRemovePayload {
    pub status: BackendSkeletonStatus,
    #[serde(rename = "removedSkillID")]
    pub removed_skill_id: String,
    pub backup: SkillBackupSummary,
    pub remaining_installed_count: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRestorePayload {
    pub status: BackendSkeletonStatus,
    pub restored_skill: InstalledSkillSummary,
    pub backup: SkillBackupSummary,
    pub rollback_backup: Option<SkillBackupSummary>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillDeleteBackupPayload {
    pub status: BackendSkeletonStatus,
    #[serde(rename = "deletedBackupID")]
    pub deleted_backup_id: String,
    pub remaining_backup_count: i32,
}
