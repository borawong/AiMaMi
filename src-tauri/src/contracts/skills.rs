use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct InstalledSkillSummary {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub summary: Option<String>,
    pub relative_path: String,
    pub directory_path: String,
    pub skill_file_path: String,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SkillListPayload {
    #[serde(default)]
    pub status: BackendSkeletonStatus,
    pub items: Vec<InstalledSkillSummary>,
    pub total: i32,
    pub root_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SkillBackupSummary {
    pub id: String,
    #[serde(rename = "skillID")]
    pub skill_id: String,
    pub name: String,
    pub title: Option<String>,
    pub relative_path: String,
    pub backup_path: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SkillBackupListPayload {
    #[serde(default)]
    pub status: BackendSkeletonStatus,
    pub items: Vec<SkillBackupSummary>,
    pub total: i32,
    pub root_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SkillImportPayload {
    #[serde(default)]
    pub status: BackendSkeletonStatus,
    pub skill: InstalledSkillSummary,
    pub replaced_existing: bool,
    pub backup: Option<SkillBackupSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SkillRemovePayload {
    #[serde(default)]
    pub status: BackendSkeletonStatus,
    #[serde(rename = "removedSkillID")]
    pub removed_skill_id: String,
    pub backup: SkillBackupSummary,
    pub remaining_installed_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SkillRestorePayload {
    #[serde(default)]
    pub status: BackendSkeletonStatus,
    pub restored_skill: InstalledSkillSummary,
    pub backup: SkillBackupSummary,
    pub rollback_backup: Option<SkillBackupSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SkillDeleteBackupPayload {
    #[serde(default)]
    pub status: BackendSkeletonStatus,
    #[serde(rename = "deletedBackupID")]
    pub deleted_backup_id: String,
    pub remaining_backup_count: i32,
}
