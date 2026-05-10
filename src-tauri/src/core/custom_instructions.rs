use crate::core::auth::current_timestamp;
use crate::core::models::{
    CoreError, CustomInstructionCurrentState, CustomInstructionHistoryAction,
    CustomInstructionHistoryEntry, CustomInstructionPreviewPayload,
    CustomInstructionProtectionState, CustomInstructionStatePayload,
};
use crate::platform::paths::CodexPaths;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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

pub fn load_state(paths: &CodexPaths) -> Result<CustomInstructionStatePayload, CoreError> {
    paths.ensure_directories()?;
    let parsed = parse_global_file(paths)?;
    let history = load_history(paths)?;
    let latest = history.first().cloned();

    Ok(CustomInstructionStatePayload {
        current: CustomInstructionCurrentState {
            global_path: paths.global_agents_path.display().to_string(),
            file_exists: parsed.file_exists,
            managed_block_present: parsed.managed_block_present,
            protection_state: parsed.protection_state,
            issue_message: parsed.issue_message,
            managed_content: parsed.managed_content,
            last_applied_at: latest.as_ref().map(|item| item.created_at),
            last_template_code: latest.as_ref().and_then(|item| item.template_code.clone()),
            last_template_title: latest.as_ref().and_then(|item| item.template_title.clone()),
        },
        history: history.into_iter().map(|item| item.to_entry()).collect(),
    })
}

pub fn preview_apply(
    paths: &CodexPaths,
    content: &str,
) -> Result<CustomInstructionPreviewPayload, CoreError> {
    paths.ensure_directories()?;
    validate_managed_content(content)?;
    let parsed = parse_global_file(paths)?;

    if parsed.protection_state == CustomInstructionProtectionState::Protected {
        return Err(CoreError::InvalidData(parsed.issue_message.unwrap_or_else(
            || "Global AGENTS file is in protected mode".to_string(),
        )));
    }

    let resulting_content = compose_with_managed_content(&parsed, content)?;

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
    paths: &CodexPaths,
    content: &str,
    template_code: Option<String>,
    template_title: Option<String>,
    source: Option<String>,
) -> Result<CustomInstructionStatePayload, CoreError> {
    paths.ensure_directories()?;
    validate_managed_content(content)?;
    let parsed = parse_global_file(paths)?;

    if parsed.protection_state == CustomInstructionProtectionState::Protected {
        return Err(CoreError::InvalidData(parsed.issue_message.unwrap_or_else(
            || "Global AGENTS file is in protected mode".to_string(),
        )));
    }

    let next_content = compose_with_managed_content(&parsed, content)?;
    if next_content == parsed.raw_content {
        return load_state(paths);
    }

    save_history_snapshot(
        paths,
        CustomInstructionHistoryAction::Apply,
        source.unwrap_or_else(|| "one_click".to_string()),
        template_code,
        template_title,
        parsed.raw_content,
    )?;
    std::fs::write(&paths.global_agents_path, next_content)?;
    load_state(paths)
}

pub fn clear_managed_block(paths: &CodexPaths) -> Result<CustomInstructionStatePayload, CoreError> {
    paths.ensure_directories()?;
    let parsed = parse_global_file(paths)?;

    if parsed.protection_state == CustomInstructionProtectionState::Protected {
        return Err(CoreError::InvalidData(parsed.issue_message.unwrap_or_else(
            || "Global AGENTS file is in protected mode".to_string(),
        )));
    }

    if !parsed.managed_block_present {
        return load_state(paths);
    }

    let cleared = clear_managed_content(&parsed)?;
    if cleared == parsed.raw_content {
        return load_state(paths);
    }

    save_history_snapshot(
        paths,
        CustomInstructionHistoryAction::Clear,
        "clear".to_string(),
        None,
        None,
        parsed.raw_content,
    )?;
    if cleared.is_empty() {
        if paths.global_agents_path.exists() {
            std::fs::remove_file(&paths.global_agents_path)?;
        }
    } else {
        std::fs::write(&paths.global_agents_path, cleared)?;
    }
    load_state(paths)
}

pub fn rollback_history(
    paths: &CodexPaths,
    history_id: &str,
) -> Result<CustomInstructionStatePayload, CoreError> {
    paths.ensure_directories()?;
    let snapshot = find_history_snapshot(paths, history_id)?
        .ok_or_else(|| CoreError::NotFound(format!("History entry not found: {history_id}")))?;
    let parsed = parse_global_file(paths)?;

    save_history_snapshot(
        paths,
        CustomInstructionHistoryAction::Rollback,
        "rollback".to_string(),
        snapshot.template_code.clone(),
        snapshot.template_title.clone(),
        parsed.raw_content,
    )?;

    if snapshot.full_content.is_empty() {
        if paths.global_agents_path.exists() {
            std::fs::remove_file(&paths.global_agents_path)?;
        }
    } else {
        std::fs::write(&paths.global_agents_path, snapshot.full_content)?;
    }

    load_state(paths)
}

fn parse_global_file(paths: &CodexPaths) -> Result<ParsedManagedBlock, CoreError> {
    let file_exists = paths.global_agents_path.exists();
    let raw_content = if file_exists {
        std::fs::read_to_string(&paths.global_agents_path)?
    } else {
        String::new()
    };

    let start_positions: Vec<usize> = raw_content
        .match_indices(MANAGED_START_MARKER)
        .map(|(idx, _)| idx)
        .collect();
    let end_positions: Vec<usize> = raw_content
        .match_indices(MANAGED_END_MARKER)
        .map(|(idx, _)| idx)
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

    if start_positions.len() != 1 || end_positions.len() != 1 {
        return Ok(ParsedManagedBlock {
            file_exists,
            protection_state: CustomInstructionProtectionState::Protected,
            issue_message: Some(
                "检测到重复或不完整的 AiMaMi 自定义指令标记，请先手动修复全局 AGENTS 文件。"
                    .to_string(),
            ),
            managed_block_present: false,
            managed_content: String::new(),
            raw_content,
            block_start: None,
            block_end: None,
        });
    }

    let block_start = start_positions[0];
    let block_end_marker_start = end_positions[0];
    if block_end_marker_start < block_start {
        return Ok(ParsedManagedBlock {
            file_exists,
            protection_state: CustomInstructionProtectionState::Protected,
            issue_message: Some(
                "AiMaMi 自定义指令标记顺序异常，请先手动修复全局 AGENTS 文件。".to_string(),
            ),
            managed_block_present: false,
            managed_content: String::new(),
            raw_content,
            block_start: None,
            block_end: None,
        });
    }

    let content_start = block_start + MANAGED_START_MARKER.len();
    let content = raw_content[content_start..block_end_marker_start]
        .trim_matches('\n')
        .to_string();

    Ok(ParsedManagedBlock {
        file_exists,
        protection_state: CustomInstructionProtectionState::Ready,
        issue_message: None,
        managed_block_present: true,
        managed_content: content,
        raw_content,
        block_start: Some(block_start),
        block_end: Some(block_end_marker_start + MANAGED_END_MARKER.len()),
    })
}

fn compose_with_managed_content(
    parsed: &ParsedManagedBlock,
    content: &str,
) -> Result<String, CoreError> {
    let normalized = normalize_managed_content(content);
    let rendered_block = render_managed_block(&normalized);

    if let (Some(start), Some(end)) = (parsed.block_start, parsed.block_end) {
        let mut next = String::with_capacity(parsed.raw_content.len() + rendered_block.len() + 8);
        next.push_str(&parsed.raw_content[..start]);
        next.push_str(&rendered_block);
        next.push_str(&parsed.raw_content[end..]);
        return Ok(next);
    }

    if parsed.raw_content.trim().is_empty() {
        return Ok(rendered_block);
    }

    let mut next = parsed.raw_content.clone();
    if !next.ends_with('\n') {
        next.push('\n');
    }
    if !next.ends_with("\n\n") {
        next.push('\n');
    }
    next.push_str(&rendered_block);
    Ok(next)
}

fn clear_managed_content(parsed: &ParsedManagedBlock) -> Result<String, CoreError> {
    let (start, end) = match (parsed.block_start, parsed.block_end) {
        (Some(start), Some(end)) => (start, end),
        _ => return Ok(parsed.raw_content.clone()),
    };

    let before = parsed.raw_content[..start].trim_end_matches('\n');
    let after = parsed.raw_content[end..].trim_start_matches('\n');

    let next = if before.is_empty() && after.is_empty() {
        String::new()
    } else if before.is_empty() {
        after.to_string()
    } else if after.is_empty() {
        format!("{before}\n")
    } else {
        format!("{before}\n\n{after}")
    };

    Ok(next)
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
        return Err(CoreError::InvalidData(
            "自定义指令内容不能包含 AiMaMi 受控区块标记。".to_string(),
        ));
    }
    Ok(())
}

fn save_history_snapshot(
    paths: &CodexPaths,
    action: CustomInstructionHistoryAction,
    source: String,
    template_code: Option<String>,
    template_title: Option<String>,
    full_content: String,
) -> Result<(), CoreError> {
    let created_at = current_timestamp();
    let id = format!("{created_at}-{}", &Uuid::new_v4().to_string()[..8]);
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
    let serialized = serde_json::to_string_pretty(&snapshot)?;
    std::fs::write(path, serialized)?;
    trim_history(paths)?;
    Ok(())
}

fn trim_history(paths: &CodexPaths) -> Result<(), CoreError> {
    let mut items = load_history(paths)?;
    if items.len() <= HISTORY_LIMIT {
        return Ok(());
    }
    items.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    for snapshot in items.into_iter().skip(HISTORY_LIMIT) {
        let path = paths
            .custom_instruction_history_dir
            .join(format!("{}.json", snapshot.id));
        if path.exists() {
            let _ = std::fs::remove_file(path);
        }
    }
    Ok(())
}

fn load_history(paths: &CodexPaths) -> Result<Vec<CustomInstructionHistorySnapshot>, CoreError> {
    if !paths.custom_instruction_history_dir.exists() {
        return Ok(vec![]);
    }

    let mut items = Vec::new();
    for entry in std::fs::read_dir(&paths.custom_instruction_history_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }
        let raw = std::fs::read_to_string(path)?;
        if let Ok(snapshot) = serde_json::from_str::<CustomInstructionHistorySnapshot>(&raw) {
            items.push(snapshot);
        }
    }
    items.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(items)
}

fn find_history_snapshot(
    paths: &CodexPaths,
    history_id: &str,
) -> Result<Option<CustomInstructionHistorySnapshot>, CoreError> {
    let path = paths
        .custom_instruction_history_dir
        .join(format!("{history_id}.json"));
    if !path.exists() {
        return Ok(None);
    }
    let raw = std::fs::read_to_string(path)?;
    let snapshot = serde_json::from_str::<CustomInstructionHistorySnapshot>(&raw)?;
    Ok(Some(snapshot))
}
