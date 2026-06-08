use crate::contracts::{
    CustomInstructionCurrentState, CustomInstructionHistoryAction, CustomInstructionHistoryEntry,
    CustomInstructionPreviewPayload, CustomInstructionProtectionState,
    CustomInstructionStatePayload,
};
use crate::core::error::CoreError;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::RepositoryPaths;
use serde::{Deserialize, Serialize};

const MANAGED_START_MARKER: &str = "<!-- AIMAMI_CUSTOM_INSTRUCTIONS_START -->";
const MANAGED_END_MARKER: &str = "<!-- AIMAMI_CUSTOM_INSTRUCTIONS_END -->";
const HISTORY_LIMIT: usize = 10;

#[derive(Debug, Clone)]
struct ParsedManagedBlock {
    file_exists: bool,
    protection_state: CustomInstructionProtectionState,
    issue_message: Option<String>,
    managed_block_present: bool,
    managed_content: String,
    raw_content: String,
    block_start: Option<usize>,
    block_end: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CustomInstructionHistorySnapshot {
    id: String,
    created_at: i64,
    action: CustomInstructionHistoryAction,
    source: String,
    template_code: Option<String>,
    template_title: Option<String>,
    full_content: String,
}

impl CustomInstructionHistorySnapshot {
    fn to_entry(&self) -> CustomInstructionHistoryEntry {
        CustomInstructionHistoryEntry {
            id: self.id.clone(),
            created_at: self.created_at,
            action: self.action.clone(),
            source: self.source.clone(),
            template_code: self.template_code.clone(),
            template_title: self.template_title.clone(),
        }
    }
}

pub fn load_state(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
) -> Result<CustomInstructionStatePayload, CoreError> {
    paths.ensure_app_directories()?;
    let parsed = parse_global_file(fs, paths)?;
    let history = load_history(fs, paths)?;
    let latest = history.first();

    Ok(CustomInstructionStatePayload {
        current: CustomInstructionCurrentState {
            global_path: paths.global_agents_path.display().to_string(),
            file_exists: parsed.file_exists,
            managed_block_present: parsed.managed_block_present,
            protection_state: parsed.protection_state,
            issue_message: parsed.issue_message,
            managed_content: parsed.managed_content,
            last_applied_at: latest.map(|item| item.created_at),
            last_template_code: latest.and_then(|item| item.template_code.clone()),
            last_template_title: latest.and_then(|item| item.template_title.clone()),
        },
        history: history.into_iter().map(|item| item.to_entry()).collect(),
    })
}

pub fn preview_apply(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
    content: &str,
) -> Result<CustomInstructionPreviewPayload, CoreError> {
    paths.ensure_app_directories()?;
    validate_managed_content(content)?;
    let parsed = parse_global_file(fs, paths)?;
    ensure_not_protected(&parsed)?;
    let resulting_content = compose_with_managed_content(&parsed, content);

    Ok(CustomInstructionPreviewPayload {
        global_path: paths.global_agents_path.display().to_string(),
        protection_state: parsed.protection_state,
        issue_message: parsed.issue_message,
        current_managed_content: parsed.managed_content,
        next_managed_content: normalize_managed_content(content),
        resulting_content,
    })
}

pub fn apply_managed_content(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
    content: &str,
    template_code: Option<String>,
    template_title: Option<String>,
    source: Option<String>,
) -> Result<CustomInstructionStatePayload, CoreError> {
    paths.ensure_app_directories()?;
    validate_managed_content(content)?;
    let parsed = parse_global_file(fs, paths)?;
    ensure_not_protected(&parsed)?;
    let next_content = compose_with_managed_content(&parsed, content);

    if next_content != parsed.raw_content {
        save_history_snapshot(
            fs,
            paths,
            CustomInstructionHistoryAction::Apply,
            source.unwrap_or_else(|| "manual".to_string()),
            template_code,
            template_title,
            parsed.raw_content,
        )?;
        fs.write_string(&paths.global_agents_path, &next_content)?;
    }

    load_state(fs, paths)
}

pub fn clear_managed_block(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
) -> Result<CustomInstructionStatePayload, CoreError> {
    paths.ensure_app_directories()?;
    let parsed = parse_global_file(fs, paths)?;
    ensure_not_protected(&parsed)?;

    if !parsed.managed_block_present {
        return load_state(fs, paths);
    }

    let next_content = clear_managed_content(&parsed);
    if next_content != parsed.raw_content {
        save_history_snapshot(
            fs,
            paths,
            CustomInstructionHistoryAction::Clear,
            "clear".to_string(),
            None,
            None,
            parsed.raw_content,
        )?;
        if next_content.is_empty() {
            fs.remove_file(&paths.global_agents_path)?;
        } else {
            fs.write_string(&paths.global_agents_path, &next_content)?;
        }
    }

    load_state(fs, paths)
}

pub fn rollback_history(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
    history_id: &str,
) -> Result<CustomInstructionStatePayload, CoreError> {
    paths.ensure_app_directories()?;
    let snapshot = find_history_snapshot(fs, paths, history_id)?
        .ok_or_else(|| CoreError::NotFound(format!("历史记录不存在：{history_id}")))?;
    let parsed = parse_global_file(fs, paths)?;
    ensure_not_protected(&parsed)?;

    save_history_snapshot(
        fs,
        paths,
        CustomInstructionHistoryAction::Rollback,
        "rollback".to_string(),
        snapshot.template_code.clone(),
        snapshot.template_title.clone(),
        parsed.raw_content,
    )?;

    if snapshot.full_content.is_empty() {
        fs.remove_file(&paths.global_agents_path)?;
    } else {
        fs.write_string(&paths.global_agents_path, &snapshot.full_content)?;
    }

    load_state(fs, paths)
}

fn parse_global_file(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
) -> Result<ParsedManagedBlock, CoreError> {
    let file_exists = fs.exists(&paths.global_agents_path);
    let raw_content = if file_exists {
        fs.read_to_string(&paths.global_agents_path)?
    } else {
        String::new()
    };

    let start_positions: Vec<usize> = raw_content
        .match_indices(MANAGED_START_MARKER)
        .map(|(index, _)| index)
        .collect();
    let end_positions: Vec<usize> = raw_content
        .match_indices(MANAGED_END_MARKER)
        .map(|(index, _)| index)
        .collect();

    if start_positions.is_empty() && end_positions.is_empty() {
        return Ok(ParsedManagedBlock {
            file_exists,
            protection_state: CustomInstructionProtectionState::Unmanaged,
            issue_message: None,
            managed_block_present: false,
            managed_content: String::new(),
            raw_content,
            block_start: None,
            block_end: None,
        });
    }

    if start_positions.len() != 1
        || end_positions.len() != 1
        || end_positions[0] < start_positions[0]
    {
        return Ok(ParsedManagedBlock {
            file_exists,
            protection_state: CustomInstructionProtectionState::Protected,
            issue_message: Some("检测到重复、不完整或顺序异常的 AiMaMi 自定义指令标记，请先手动修复全局 AGENTS 文件。".to_string()),
            managed_block_present: false,
            managed_content: String::new(),
            raw_content,
            block_start: None,
            block_end: None,
        });
    }

    let block_start = start_positions[0];
    let block_end_marker_start = end_positions[0];
    let content_start = block_start + MANAGED_START_MARKER.len();
    let managed_content = raw_content[content_start..block_end_marker_start]
        .trim_matches('\n')
        .to_string();

    Ok(ParsedManagedBlock {
        file_exists,
        protection_state: CustomInstructionProtectionState::Ready,
        issue_message: None,
        managed_block_present: true,
        managed_content,
        raw_content,
        block_start: Some(block_start),
        block_end: Some(block_end_marker_start + MANAGED_END_MARKER.len()),
    })
}

fn ensure_not_protected(parsed: &ParsedManagedBlock) -> Result<(), CoreError> {
    if parsed.protection_state == CustomInstructionProtectionState::Protected {
        return Err(CoreError::InvalidInput(
            parsed
                .issue_message
                .clone()
                .unwrap_or_else(|| "全局 AGENTS 文件处于保护状态".to_string()),
        ));
    }
    Ok(())
}

fn compose_with_managed_content(parsed: &ParsedManagedBlock, content: &str) -> String {
    let normalized = normalize_managed_content(content);
    let rendered = render_managed_block(&normalized);

    if let (Some(start), Some(end)) = (parsed.block_start, parsed.block_end) {
        let mut next = String::new();
        next.push_str(&parsed.raw_content[..start]);
        next.push_str(&rendered);
        next.push_str(&parsed.raw_content[end..]);
        return next;
    }

    if parsed.raw_content.trim().is_empty() {
        return rendered;
    }

    let mut next = parsed.raw_content.clone();
    if !next.ends_with('\n') {
        next.push('\n');
    }
    if !next.ends_with("\n\n") {
        next.push('\n');
    }
    next.push_str(&rendered);
    next
}

fn clear_managed_content(parsed: &ParsedManagedBlock) -> String {
    let (Some(start), Some(end)) = (parsed.block_start, parsed.block_end) else {
        return parsed.raw_content.clone();
    };
    let before = parsed.raw_content[..start].trim_end_matches('\n');
    let after = parsed.raw_content[end..].trim_start_matches('\n');

    if before.is_empty() && after.is_empty() {
        String::new()
    } else if before.is_empty() {
        after.to_string()
    } else if after.is_empty() {
        format!("{before}\n")
    } else {
        format!("{before}\n\n{after}")
    }
}

fn render_managed_block(content: &str) -> String {
    if content.is_empty() {
        format!("{MANAGED_START_MARKER}\n{MANAGED_END_MARKER}\n")
    } else {
        format!("{MANAGED_START_MARKER}\n{content}\n{MANAGED_END_MARKER}\n")
    }
}

fn normalize_managed_content(content: &str) -> String {
    content.trim().trim_matches('\n').to_string()
}

fn validate_managed_content(content: &str) -> Result<(), CoreError> {
    if content.contains(MANAGED_START_MARKER) || content.contains(MANAGED_END_MARKER) {
        return Err(CoreError::InvalidInput(
            "自定义指令内容不能包含 AiMaMi 受控区块标记。".to_string(),
        ));
    }
    Ok(())
}

fn save_history_snapshot(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
    action: CustomInstructionHistoryAction,
    source: String,
    template_code: Option<String>,
    template_title: Option<String>,
    full_content: String,
) -> Result<(), CoreError> {
    let created_at = crate::application::service::current_timestamp();
    let id = format!("{created_at}-{}", &uuid::Uuid::new_v4().to_string()[..8]);
    let snapshot = CustomInstructionHistorySnapshot {
        id: id.clone(),
        created_at,
        action,
        source,
        template_code,
        template_title,
        full_content,
    };
    let path = paths
        .custom_instruction_history_dir
        .join(format!("{id}.json"));
    fs.write_string(&path, &serde_json::to_string_pretty(&snapshot)?)?;
    trim_history(fs, paths)
}

fn load_history(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
) -> Result<Vec<CustomInstructionHistorySnapshot>, CoreError> {
    if !fs.exists(&paths.custom_instruction_history_dir) {
        return Ok(Vec::new());
    }

    let mut items = Vec::new();
    for entry in fs.read_dir(&paths.custom_instruction_history_dir)? {
        if entry.path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }
        let raw = fs.read_to_string(&entry.path)?;
        if let Ok(snapshot) = serde_json::from_str::<CustomInstructionHistorySnapshot>(&raw) {
            items.push(snapshot);
        }
    }
    items.sort_by(|left, right| right.created_at.cmp(&left.created_at));
    Ok(items)
}

fn find_history_snapshot(
    fs: &dyn FileSystemAdapter,
    paths: &RepositoryPaths,
    history_id: &str,
) -> Result<Option<CustomInstructionHistorySnapshot>, CoreError> {
    let path = paths
        .custom_instruction_history_dir
        .join(format!("{history_id}.json"));
    if !fs.exists(&path) {
        return Ok(None);
    }
    let raw = fs.read_to_string(&path)?;
    Ok(Some(serde_json::from_str(&raw)?))
}

fn trim_history(fs: &dyn FileSystemAdapter, paths: &RepositoryPaths) -> Result<(), CoreError> {
    let mut items = load_history(fs, paths)?;
    if items.len() <= HISTORY_LIMIT {
        return Ok(());
    }
    items.sort_by(|left, right| right.created_at.cmp(&left.created_at));
    for snapshot in items.into_iter().skip(HISTORY_LIMIT) {
        fs.remove_file(
            &paths
                .custom_instruction_history_dir
                .join(format!("{}.json", snapshot.id)),
        )?;
    }
    Ok(())
}
