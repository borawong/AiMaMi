use crate::contracts::{InstalledSkillSummary, SkillBackupSummary};
use crate::core::error::CoreError;
use crate::repository::adapter::FileSystemAdapter;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
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

pub fn load_installed(
    fs: &dyn FileSystemAdapter,
    skills_dir: &Path,
) -> Result<Vec<InstalledSkillSummary>, CoreError> {
    if !fs.exists(skills_dir) {
        return Ok(Vec::new());
    }

    let mut items = Vec::new();
    scan_skills_recursive(fs, skills_dir, skills_dir, &mut items)?;
    items.sort_by(|left, right| {
        right
            .updated_at
            .unwrap_or_default()
            .cmp(&left.updated_at.unwrap_or_default())
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
    });
    Ok(items)
}

pub fn load_backups(
    fs: &dyn FileSystemAdapter,
    backup_dir: &Path,
) -> Result<Vec<SkillBackupSummary>, CoreError> {
    if !fs.exists(backup_dir) {
        return Ok(Vec::new());
    }

    let mut items = Vec::new();
    for entry in fs.read_dir(backup_dir)? {
        if !entry.is_dir {
            continue;
        }
        let meta_path = entry.path.join("metadata.json");
        if !fs.exists(&meta_path) {
            continue;
        }
        let meta: SkillBackupMetadata = serde_json::from_str(&fs.read_to_string(&meta_path)?)?;
        items.push(SkillBackupSummary {
            id: meta.backup_id,
            skill_id: meta.skill_id,
            name: meta.name,
            title: meta.title,
            relative_path: meta.relative_path,
            backup_path: entry.path.join("skill").display().to_string(),
            created_at: meta.created_at,
        });
    }
    items.sort_by(|left, right| right.created_at.cmp(&left.created_at));
    Ok(items)
}

pub fn import_skill(
    fs: &dyn FileSystemAdapter,
    skills_dir: &Path,
    app_data_dir: &Path,
    source_path: &str,
) -> Result<(InstalledSkillSummary, bool, Option<SkillBackupSummary>), CoreError> {
    fs.create_dir_all(skills_dir)?;
    let backup_dir = app_data_dir.join("skill-backups");
    fs.create_dir_all(&backup_dir)?;

    let source = resolve_skill_source(fs, Path::new(source_path))?;
    let file_name = source
        .file_name()
        .ok_or_else(|| CoreError::InvalidInput("技能目录缺少名称".to_string()))?;
    let target = skills_dir.join(PathBuf::from(file_name.to_os_string()));

    if paths_equal(&source, &target) {
        let skill = load_skill_summary(fs, &target.join("SKILL.md"), skills_dir)
            .ok_or_else(|| CoreError::InvalidInput("技能源无效".to_string()))?;
        return Ok((skill, false, None));
    }

    let replaced = fs.exists(&target);
    let backup = if replaced {
        let backup = backup_skill_directory(fs, &target, skills_dir, &backup_dir, "replace")?;
        fs.remove_dir_all(&target)?;
        Some(backup)
    } else {
        None
    };

    copy_dir_all(fs, &source, &target)?;
    let skill = load_skill_summary(fs, &target.join("SKILL.md"), skills_dir)
        .ok_or_else(|| CoreError::InvalidInput("导入后的技能无效".to_string()))?;
    Ok((skill, replaced, backup))
}

pub fn remove_skill(
    fs: &dyn FileSystemAdapter,
    skills_dir: &Path,
    app_data_dir: &Path,
    id: &str,
) -> Result<(SkillBackupSummary, i32), CoreError> {
    let installed = load_installed(fs, skills_dir)?;
    let skill = installed
        .iter()
        .find(|skill| skill.id == id)
        .ok_or_else(|| CoreError::NotFound(format!("技能不存在：{id}")))?;

    let backup_dir = app_data_dir.join("skill-backups");
    let dir = PathBuf::from(&skill.directory_path);
    let backup = backup_skill_directory(fs, &dir, skills_dir, &backup_dir, "remove")?;
    fs.remove_dir_all(&dir)?;
    let remaining = load_installed(fs, skills_dir)?.len() as i32;
    Ok((backup, remaining))
}

pub fn restore_backup(
    fs: &dyn FileSystemAdapter,
    skills_dir: &Path,
    app_data_dir: &Path,
    backup_id: &str,
) -> Result<
    (
        InstalledSkillSummary,
        SkillBackupSummary,
        Option<SkillBackupSummary>,
    ),
    CoreError,
> {
    let backup_dir = app_data_dir.join("skill-backups");
    let backup_path = backup_dir.join(backup_id);
    if !fs.exists(&backup_path) {
        return Err(CoreError::NotFound(format!("备份不存在：{backup_id}")));
    }

    let meta_path = backup_path.join("metadata.json");
    let meta: SkillBackupMetadata = serde_json::from_str(&fs.read_to_string(&meta_path)?)?;
    let staged = backup_path.join("skill");
    if !fs.exists(&staged) {
        return Err(CoreError::InvalidInput("技能备份损坏".to_string()));
    }

    let target = skills_dir.join(&meta.relative_path);
    if let Some(parent) = target.parent() {
        fs.create_dir_all(parent)?;
    }

    let rollback_backup = if fs.exists(&target) {
        let backup =
            backup_skill_directory(fs, &target, skills_dir, &backup_dir, "restore-rollback")?;
        fs.remove_dir_all(&target)?;
        Some(backup)
    } else {
        None
    };

    copy_dir_all(fs, &staged, &target)?;
    let restored = load_skill_summary(fs, &target.join("SKILL.md"), skills_dir)
        .ok_or_else(|| CoreError::InvalidInput("恢复后的技能无效".to_string()))?;
    let backup_summary = SkillBackupSummary {
        id: meta.backup_id,
        skill_id: meta.skill_id,
        name: meta.name,
        title: meta.title,
        relative_path: meta.relative_path,
        backup_path: staged.display().to_string(),
        created_at: meta.created_at,
    };
    Ok((restored, backup_summary, rollback_backup))
}

pub fn delete_backup(
    fs: &dyn FileSystemAdapter,
    app_data_dir: &Path,
    backup_id: &str,
) -> Result<i32, CoreError> {
    let backup_dir = app_data_dir.join("skill-backups");
    let path = backup_dir.join(backup_id);
    if !fs.exists(&path) {
        return Err(CoreError::NotFound(format!("备份不存在：{backup_id}")));
    }
    fs.remove_dir_all(&path)?;
    Ok(load_backups(fs, &backup_dir)?.len() as i32)
}

fn scan_skills_recursive(
    fs: &dyn FileSystemAdapter,
    dir: &Path,
    root: &Path,
    items: &mut Vec<InstalledSkillSummary>,
) -> Result<(), CoreError> {
    for entry in fs.read_dir(dir)? {
        let name = entry
            .path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default();
        if name.starts_with('.') {
            continue;
        }
        if !entry.is_dir {
            continue;
        }

        let skill_file = entry.path.join("SKILL.md");
        if fs.exists(&skill_file) {
            if let Some(summary) = load_skill_summary(fs, &skill_file, root) {
                items.push(summary);
            }
        } else {
            scan_skills_recursive(fs, &entry.path, root, items)?;
        }
    }
    Ok(())
}

fn load_skill_summary(
    fs: &dyn FileSystemAdapter,
    skill_file: &Path,
    root: &Path,
) -> Option<InstalledSkillSummary> {
    let text = fs.read_to_string(skill_file).ok()?;
    let dir = skill_file.parent()?;
    let relative = dir
        .strip_prefix(root)
        .map(Path::to_path_buf)
        .unwrap_or_else(|_| PathBuf::from(dir.file_name().unwrap_or_default().to_os_string()));
    let name = dir.file_name()?.to_str()?.to_string();
    let relative_path = relative.display().to_string();

    Some(InstalledSkillSummary {
        id: relative_path.clone(),
        name,
        title: first_markdown_heading(&text),
        summary: first_skill_summary_line(&text),
        relative_path,
        directory_path: dir.display().to_string(),
        skill_file_path: skill_file.display().to_string(),
        updated_at: fs.modified_unix_seconds(skill_file),
    })
}

fn backup_skill_directory(
    fs: &dyn FileSystemAdapter,
    dir: &Path,
    skills_root: &Path,
    backup_dir: &Path,
    reason: &str,
) -> Result<SkillBackupSummary, CoreError> {
    let skill = load_skill_summary(fs, &dir.join("SKILL.md"), skills_root)
        .ok_or_else(|| CoreError::InvalidInput("技能源无效".to_string()))?;
    fs.create_dir_all(backup_dir)?;
    let created_at = crate::application::service::current_timestamp();
    let safe_path = skill.relative_path.replace('/', "__").replace('\\', "__");
    let backup_id = format!(
        "{created_at}-{safe_path}-{reason}-{}",
        &uuid::Uuid::new_v4().to_string()[..8]
    );
    let backup_path = backup_dir.join(&backup_id);
    let staged = backup_path.join("skill");
    fs.create_dir_all(&backup_path)?;
    copy_dir_all(fs, dir, &staged)?;

    let meta = SkillBackupMetadata {
        backup_id: backup_id.clone(),
        skill_id: skill.id.clone(),
        name: skill.name.clone(),
        title: skill.title.clone(),
        relative_path: skill.relative_path.clone(),
        created_at,
    };
    fs.write_string(
        &backup_path.join("metadata.json"),
        &serde_json::to_string_pretty(&meta)?,
    )?;

    Ok(SkillBackupSummary {
        id: backup_id,
        skill_id: skill.id,
        name: skill.name,
        title: skill.title,
        relative_path: skill.relative_path,
        backup_path: staged.display().to_string(),
        created_at,
    })
}

fn resolve_skill_source(fs: &dyn FileSystemAdapter, path: &Path) -> Result<PathBuf, CoreError> {
    if !fs.exists(path) {
        return Err(CoreError::NotFound(format!(
            "路径不存在：{}",
            path.display()
        )));
    }
    if fs.exists(&path.join("SKILL.md")) {
        return Ok(path.to_path_buf());
    }
    if path
        .file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| name == "SKILL.md")
    {
        return path
            .parent()
            .map(Path::to_path_buf)
            .ok_or_else(|| CoreError::InvalidInput("SKILL.md 缺少父目录".to_string()));
    }
    Err(CoreError::InvalidInput(
        "技能源必须是包含 SKILL.md 的目录，或 SKILL.md 文件".to_string(),
    ))
}

fn copy_dir_all(fs: &dyn FileSystemAdapter, source: &Path, target: &Path) -> Result<(), CoreError> {
    fs.create_dir_all(target)?;
    for entry in fs.read_dir(source)? {
        let file_name = entry
            .path
            .file_name()
            .ok_or_else(|| CoreError::InvalidInput("源路径缺少文件名".to_string()))?;
        let destination = target.join(PathBuf::from(file_name.to_os_string()));
        if entry.is_dir {
            copy_dir_all(fs, &entry.path, &destination)?;
        } else {
            fs.copy_file(&entry.path, &destination)?;
        }
    }
    Ok(())
}

fn first_markdown_heading(text: &str) -> Option<String> {
    text.lines().find_map(|line| {
        let trimmed = line.trim();
        if !trimmed.starts_with('#') {
            return None;
        }
        let heading = trimmed.trim_start_matches('#').trim();
        (!heading.is_empty()).then(|| heading.to_string())
    })
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
        if in_frontmatter
            || trimmed.starts_with('#')
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

fn paths_equal(left: &Path, right: &Path) -> bool {
    left == right
}
