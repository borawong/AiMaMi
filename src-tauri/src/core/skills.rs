use crate::core::auth::current_timestamp;
use crate::core::models::*;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkillBackupMetadata {
    #[serde(rename = "backupID")]
    backup_id: String,
    #[serde(rename = "skillID")]
    skill_id: String,
    name: String,
    title: Option<String>,
    relative_path: String,
    created_at: i64,
}

pub fn load_installed_skills(skills_dir: &Path) -> Result<Vec<InstalledSkillSummary>, CoreError> {
    if !skills_dir.exists() {
        return Ok(vec![]);
    }
    let mut items = Vec::new();
    scan_skills_recursive(skills_dir, skills_dir, &mut items);
    items.sort_by(|a, b| {
        b.updated_at
            .unwrap_or(0)
            .cmp(&a.updated_at.unwrap_or(0))
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(items)
}

fn scan_skills_recursive(dir: &Path, root: &Path, items: &mut Vec<InstalledSkillSummary>) {
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path
            .file_name()
            .map_or(false, |n| n.to_str().map_or(false, |s| s.starts_with('.')))
        {
            continue;
        }
        if path.is_dir() {
            let skill_file = path.join("SKILL.md");
            if skill_file.exists() {
                if let Some(summary) = load_skill_summary(&skill_file, root) {
                    items.push(summary);
                }
            } else {
                scan_skills_recursive(&path, root, items);
            }
        }
    }
}

fn load_skill_summary(skill_file: &Path, root: &Path) -> Option<InstalledSkillSummary> {
    let text = std::fs::read_to_string(skill_file).ok()?;
    let dir = skill_file.parent()?;
    let title = first_markdown_heading(&text);
    let summary = first_skill_summary_line(&text);
    let updated_at = std::fs::metadata(skill_file)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64);

    let relative: PathBuf = dir
        .strip_prefix(root)
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|_| PathBuf::from(dir.file_name().unwrap_or_default()));
    let name = dir.file_name()?.to_str()?.to_string();
    let relative_path = relative.display().to_string();

    Some(InstalledSkillSummary {
        id: relative_path.clone(),
        name,
        title,
        summary,
        relative_path,
        directory_path: dir.display().to_string(),
        skill_file_path: skill_file.display().to_string(),
        updated_at,
    })
}

pub fn load_skill_backups(backup_dir: &Path) -> Result<Vec<SkillBackupSummary>, CoreError> {
    if !backup_dir.exists() {
        return Ok(vec![]);
    }
    let mut items = Vec::new();
    if let Ok(entries) = std::fs::read_dir(backup_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let meta_path = path.join("metadata.json");
            if !meta_path.exists() {
                continue;
            }
            if let Ok(data) = std::fs::read_to_string(&meta_path) {
                if let Ok(meta) = serde_json::from_str::<SkillBackupMetadata>(&data) {
                    items.push(SkillBackupSummary {
                        id: meta.backup_id,
                        skill_id: meta.skill_id,
                        name: meta.name,
                        title: meta.title,
                        relative_path: meta.relative_path,
                        backup_path: path.join("skill").display().to_string(),
                        created_at: meta.created_at,
                    });
                }
            }
        }
    }
    items.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(items)
}

pub fn import_skill(
    skills_dir: &Path,
    codexmate_dir: &Path,
    source_path: &str,
) -> Result<SkillImportPayload, CoreError> {
    std::fs::create_dir_all(skills_dir)?;
    let backup_dir = codexmate_dir.join("skill-backups");
    std::fs::create_dir_all(&backup_dir)?;

    let source = resolve_skill_source(Path::new(source_path))?;
    let target = skills_dir.join(source.file_name().unwrap_or_default());

    let source_canonical = std::fs::canonicalize(&source).unwrap_or_else(|_| source.clone());
    let target_canonical = if target.exists() {
        std::fs::canonicalize(&target).unwrap_or_else(|_| target.clone())
    } else {
        target.clone()
    };
    if source_canonical == target_canonical {
        let skill = load_skill_summary(&target.join("SKILL.md"), skills_dir)
            .ok_or_else(|| CoreError::InvalidData("Invalid skill source".into()))?;
        return Ok(SkillImportPayload {
            skill,
            replaced_existing: false,
            backup: None,
        });
    }

    let mut backup = None;
    let replaced = target.exists();
    if replaced {
        backup = Some(backup_skill_directory(
            &target,
            skills_dir,
            &backup_dir,
            "replace",
        )?);
        std::fs::remove_dir_all(&target)?;
    }

    copy_dir_all(&source, &target)?;
    let skill = load_skill_summary(&target.join("SKILL.md"), skills_dir)
        .ok_or_else(|| CoreError::InvalidData("Invalid skill after import".into()))?;

    Ok(SkillImportPayload {
        skill,
        replaced_existing: replaced,
        backup,
    })
}

pub fn remove_skill(
    skills_dir: &Path,
    codexmate_dir: &Path,
    id: &str,
) -> Result<SkillRemovePayload, CoreError> {
    let installed = load_installed_skills(skills_dir)?;
    let skill = installed
        .iter()
        .find(|s| s.id == id)
        .ok_or_else(|| CoreError::NotFound(format!("Skill not found: {id}")))?;

    let backup_dir = codexmate_dir.join("skill-backups");
    let dir = PathBuf::from(&skill.directory_path);
    let backup = backup_skill_directory(&dir, skills_dir, &backup_dir, "remove")?;

    if dir.exists() {
        std::fs::remove_dir_all(&dir)?;
    }
    let remaining = load_installed_skills(skills_dir)?.len() as i32;

    Ok(SkillRemovePayload {
        removed_skill_id: id.to_string(),
        backup,
        remaining_installed_count: remaining,
    })
}

pub fn restore_skill_backup(
    skills_dir: &Path,
    codexmate_dir: &Path,
    backup_id: &str,
) -> Result<SkillRestorePayload, CoreError> {
    let backup_dir = codexmate_dir.join("skill-backups");
    let backup_path = backup_dir.join(backup_id);
    if !backup_path.exists() {
        return Err(CoreError::NotFound(format!(
            "Backup not found: {backup_id}"
        )));
    }

    let meta_data = std::fs::read_to_string(backup_path.join("metadata.json"))?;
    let meta: SkillBackupMetadata = serde_json::from_str(&meta_data)?;
    let staged = backup_path.join("skill");
    if !staged.exists() {
        return Err(CoreError::InvalidData(format!(
            "Backup corrupted: {backup_id}"
        )));
    }

    let target = skills_dir.join(&meta.relative_path);
    std::fs::create_dir_all(target.parent().unwrap_or(skills_dir))?;

    let mut rollback_backup = None;
    if target.exists() {
        rollback_backup = Some(backup_skill_directory(
            &target,
            skills_dir,
            &backup_dir,
            "restore-rollback",
        )?);
        std::fs::remove_dir_all(&target)?;
    }

    copy_dir_all(&staged, &target)?;
    let restored = load_skill_summary(&target.join("SKILL.md"), skills_dir)
        .ok_or_else(|| CoreError::InvalidData("Backup corrupted".into()))?;

    let backup_summary = SkillBackupSummary {
        id: meta.backup_id,
        skill_id: meta.skill_id,
        name: meta.name,
        title: meta.title,
        relative_path: meta.relative_path,
        backup_path: staged.display().to_string(),
        created_at: meta.created_at,
    };

    Ok(SkillRestorePayload {
        restored_skill: restored,
        backup: backup_summary,
        rollback_backup,
    })
}

pub fn delete_skill_backup(
    codexmate_dir: &Path,
    backup_id: &str,
) -> Result<SkillDeleteBackupPayload, CoreError> {
    let backup_dir = codexmate_dir.join("skill-backups");
    let path = backup_dir.join(backup_id);
    if !path.exists() {
        return Err(CoreError::NotFound(format!(
            "Backup not found: {backup_id}"
        )));
    }
    std::fs::remove_dir_all(&path)?;
    let remaining = load_skill_backups(&backup_dir)?.len() as i32;
    Ok(SkillDeleteBackupPayload {
        deleted_backup_id: backup_id.to_string(),
        remaining_backup_count: remaining,
    })
}

fn backup_skill_directory(
    dir: &Path,
    skills_root: &Path,
    backup_dir: &Path,
    reason: &str,
) -> Result<SkillBackupSummary, CoreError> {
    let skill = load_skill_summary(&dir.join("SKILL.md"), skills_root)
        .ok_or_else(|| CoreError::InvalidData("Invalid skill source".into()))?;
    std::fs::create_dir_all(backup_dir)?;
    let ts = current_timestamp();
    let safe_path = skill.relative_path.replace('/', "__");
    let backup_id = format!(
        "{ts}-{safe_path}-{reason}-{}",
        &uuid::Uuid::new_v4().to_string()[..8]
    );
    let backup_path = backup_dir.join(&backup_id);
    let staged = backup_path.join("skill");
    std::fs::create_dir_all(&backup_path)?;
    copy_dir_all(dir, &staged)?;

    let meta = SkillBackupMetadata {
        backup_id: backup_id.clone(),
        skill_id: skill.id.clone(),
        name: skill.name.clone(),
        title: skill.title.clone(),
        relative_path: skill.relative_path.clone(),
        created_at: ts,
    };
    let meta_json = serde_json::to_string_pretty(&meta)?;
    std::fs::write(backup_path.join("metadata.json"), meta_json)?;

    Ok(SkillBackupSummary {
        id: backup_id,
        skill_id: skill.id,
        name: skill.name,
        title: skill.title,
        relative_path: skill.relative_path,
        backup_path: staged.display().to_string(),
        created_at: ts,
    })
}

fn resolve_skill_source(path: &Path) -> Result<PathBuf, CoreError> {
    if !path.exists() {
        return Err(CoreError::NotFound(format!(
            "Path not found: {}",
            path.display()
        )));
    }
    if path.is_dir() {
        if path.join("SKILL.md").exists() {
            return Ok(path.to_path_buf());
        }
        return Err(CoreError::InvalidData(
            "Directory must contain SKILL.md".into(),
        ));
    }
    if path.file_name().map_or(false, |n| n == "SKILL.md") {
        return Ok(path.parent().unwrap_or(path).to_path_buf());
    }
    Err(CoreError::InvalidData(
        "Must be a directory with SKILL.md or a SKILL.md file".into(),
    ))
}

fn copy_dir_all(src: &Path, dst: &Path) -> Result<(), CoreError> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)?.flatten() {
        let target = dst.join(entry.file_name());
        if entry.path().is_dir() {
            copy_dir_all(&entry.path(), &target)?;
        } else {
            std::fs::copy(entry.path(), target)?;
        }
    }
    Ok(())
}

fn first_markdown_heading(text: &str) -> Option<String> {
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('#') {
            let heading: String = trimmed
                .chars()
                .skip_while(|c| *c == '#' || *c == ' ')
                .collect();
            if !heading.is_empty() {
                return Some(heading);
            }
        }
    }
    None
}

fn first_skill_summary_line(text: &str) -> Option<String> {
    let mut in_frontmatter = false;
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if trimmed == "---" {
            in_frontmatter = !in_frontmatter;
            continue;
        }
        if in_frontmatter {
            continue;
        }
        if trimmed.starts_with('#')
            || trimmed.starts_with("```")
            || trimmed.starts_with("- ")
            || trimmed.starts_with("* ")
        {
            continue;
        }
        return Some(trimmed.to_string());
    }
    None
}
