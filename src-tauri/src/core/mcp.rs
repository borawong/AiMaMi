use crate::core::models::*;
use std::collections::HashMap;
use std::path::Path;

const MANAGED_BLOCK_BEGIN_PREFIX: &str = "# --- AiMaMi Managed";
const MANAGED_BLOCK_END_SUFFIX: &str = "# --- End AiMaMi Managed";

fn is_managed_block_begin(line: &str) -> bool {
    line.starts_with(MANAGED_BLOCK_BEGIN_PREFIX)
}

fn is_managed_block_end(line: &str) -> bool {
    line.starts_with(MANAGED_BLOCK_END_SUFFIX)
}

const BOTTOM_MANAGED_BLOCK_BEGIN: &str = "# --- AiMaMi Managed Block (bottom) ---";
const LEGACY_TOP_MANAGED_BLOCK_BEGIN: &str = "# --- AiMaMi Managed Block (top) ---";
const ROUTER_TOP_MANAGED_BLOCK_BEGIN: &str = "# --- AiMaMi Managed Block (router-top) ---";

pub fn load_mcp_servers(config_path: &Path) -> Result<Vec<McpServerSummary>, CoreError> {
    if !config_path.exists() {
        return Ok(vec![]);
    }
    let text = std::fs::read_to_string(config_path)?;
    Ok(parse_mcp_servers(&text, &config_path.display().to_string()))
}

pub fn upsert_mcp_server(
    config_path: &Path,
    server: &McpServerSummary,
) -> Result<McpServerSummary, CoreError> {
    write_mcp_server(config_path, server)?;
    let servers = load_mcp_servers(config_path)?;
    Ok(servers
        .into_iter()
        .find(|s| s.name == server.name)
        .unwrap_or_else(|| server.clone()))
}

pub fn set_mcp_server_enabled(
    config_path: &Path,
    name: &str,
    enabled: bool,
) -> Result<McpServerSummary, CoreError> {
    let servers = load_mcp_servers(config_path)?;
    let current = servers
        .iter()
        .find(|s| s.name == name)
        .ok_or_else(|| CoreError::NotFound(format!("MCP server not found: {name}")))?;
    let mut updated = current.clone();
    updated.enabled = enabled;
    upsert_mcp_server(config_path, &updated)
}

pub fn remove_mcp_server(config_path: &Path, name: &str) -> Result<(), CoreError> {
    let original = load_config_text(config_path)?;
    let document = parse_mcp_document(&original);
    let block = document
        .blocks
        .get(name)
        .ok_or_else(|| CoreError::NotFound(format!("MCP server not found: {name}")))?;
    let mut lines = document.lines.clone();
    lines.drain(block.start..block.end);
    // Remove trailing empty lines
    while lines.len() >= 2
        && lines.last().map_or(false, |l| l.trim().is_empty())
        && lines[lines.len() - 2].trim().is_empty()
    {
        lines.pop();
    }
    save_config_text(config_path, &lines.join("\n"))?;
    Ok(())
}

fn write_mcp_server(config_path: &Path, server: &McpServerSummary) -> Result<(), CoreError> {
    let original = load_config_text(config_path)?;
    let document = parse_mcp_document(&original);
    let rendered = render_mcp_block(server);

    let updated = if let Some(existing) = document.blocks.get(&server.name) {
        if should_relocate_mcp_block(&document.lines, existing) {
            let mut lines = document.lines.clone();
            lines.drain(existing.start..existing.end);
            insert_mcp_block(lines, rendered)
        } else {
            let mut lines = document.lines.clone();
            lines.splice(existing.start..existing.end, rendered);
            lines
        }
    } else {
        insert_mcp_block(document.lines.clone(), rendered)
    };

    save_config_text(config_path, &updated.join("\n"))?;
    Ok(())
}

fn insert_mcp_block(mut lines: Vec<String>, rendered: Vec<String>) -> Vec<String> {
    let mut insert_pos = find_mcp_insert_pos(&lines);

    // 移除插入点之前的尾部空行，避免反复新增 MCP 后空行膨胀。
    while insert_pos > 0
        && lines
            .get(insert_pos - 1)
            .map_or(false, |l| l.trim().is_empty())
    {
        lines.remove(insert_pos - 1);
        insert_pos -= 1;
    }

    if insert_pos > 0 {
        lines.insert(insert_pos, String::new());
        insert_pos += 1;
    }
    lines.splice(insert_pos..insert_pos, rendered);
    lines
}

fn find_mcp_insert_pos(lines: &[String]) -> usize {
    lines
        .iter()
        .position(|line| line.trim() == BOTTOM_MANAGED_BLOCK_BEGIN)
        .unwrap_or(lines.len())
}

fn should_relocate_mcp_block(lines: &[String], block: &McpBlock) -> bool {
    is_inside_managed_block(lines, block.start) || is_before_top_managed_block(lines, block.start)
}

fn is_before_top_managed_block(lines: &[String], index: usize) -> bool {
    lines
        .iter()
        .position(|line| {
            let trimmed = line.trim();
            trimmed == LEGACY_TOP_MANAGED_BLOCK_BEGIN || trimmed == ROUTER_TOP_MANAGED_BLOCK_BEGIN
        })
        .map_or(false, |top_start| index < top_start)
}

fn is_inside_managed_block(lines: &[String], index: usize) -> bool {
    let mut inside = false;
    for (i, line) in lines.iter().enumerate() {
        if i == index {
            return inside;
        }
        let trimmed = line.trim();
        if is_managed_block_begin(trimmed) {
            inside = true;
            continue;
        }
        if is_managed_block_end(trimmed) {
            inside = false;
        }
    }
    false
}

fn render_mcp_block(server: &McpServerSummary) -> Vec<String> {
    let header = quote_toml(&server.name);
    let mut lines = vec![format!("[mcp_servers.{header}]")];
    lines.push(format!(
        "enabled = {}",
        if server.enabled { "true" } else { "false" }
    ));
    let transport_str = match server.transport {
        McpTransport::Stdio => "stdio",
        McpTransport::Http => "http",
        McpTransport::Sse => "sse",
        McpTransport::Unknown => "stdio",
    };
    lines.push(format!("transport = {}", quote_toml(transport_str)));

    match server.transport {
        McpTransport::Stdio | McpTransport::Unknown => {
            if let Some(ref cmd) = server.command {
                if !cmd.trim().is_empty() {
                    lines.push(format!("command = {}", quote_toml(cmd)));
                }
            }
            if !server.args.is_empty() {
                let args_str = server
                    .args
                    .iter()
                    .map(|a| quote_toml(a))
                    .collect::<Vec<_>>()
                    .join(", ");
                lines.push(format!("args = [{args_str}]"));
            }
        }
        McpTransport::Http | McpTransport::Sse => {
            if let Some(ref url) = server.url {
                if !url.trim().is_empty() {
                    lines.push(format!("url = {}", quote_toml(url)));
                }
            }
        }
    }

    if !server.environment.is_empty() {
        lines.push(String::new());
        lines.push(format!("[mcp_servers.{header}.env]"));
        let mut keys: Vec<&String> = server.environment.keys().collect();
        keys.sort();
        for key in keys {
            let value = server
                .environment
                .get(key)
                .map(|s| s.as_str())
                .unwrap_or("");
            lines.push(format!("{key} = {}", quote_toml(value)));
        }
    }

    if !server.headers.is_empty() {
        lines.push(String::new());
        lines.push(format!("[mcp_servers.{header}.headers]"));
        let mut keys: Vec<&String> = server.headers.keys().collect();
        keys.sort();
        for key in keys {
            let value = server.headers.get(key).map(|s| s.as_str()).unwrap_or("");
            lines.push(format!("{key} = {}", quote_toml(value)));
        }
    }

    lines
}

fn quote_toml(s: &str) -> String {
    let escaped = s.replace('\\', "\\\\").replace('"', "\\\"");
    format!("\"{escaped}\"")
}

struct McpDocument {
    lines: Vec<String>,
    blocks: HashMap<String, McpBlock>,
}

struct McpBlock {
    start: usize,
    end: usize,
}

fn parse_mcp_document(text: &str) -> McpDocument {
    let lines: Vec<String> = text.lines().map(|l| l.to_string()).collect();
    let mut blocks: HashMap<String, McpBlock> = HashMap::new();
    let mut current_name: Option<String> = None;
    let mut current_start: Option<usize> = None;

    for (i, line) in lines.iter().enumerate() {
        let trimmed = strip_toml_comment(line).trim().to_string();
        if !(trimmed.starts_with('[') && trimmed.ends_with(']')) {
            continue;
        }
        let header = &trimmed[1..trimmed.len() - 1];
        let section = parse_mcp_section_header(header);

        if let (Some(ref name), Some(start)) = (&current_name, current_start) {
            let continues = section.as_ref().map_or(false, |(sn, _)| sn == name);
            if !continues {
                blocks.insert(name.clone(), McpBlock { start, end: i });
                current_name = None;
                current_start = None;
            }
        }

        if let Some((server_name, _)) = section {
            if current_name.is_none() {
                current_name = Some(server_name);
                current_start = Some(i);
            }
        }
    }

    if let (Some(name), Some(start)) = (current_name, current_start) {
        blocks.insert(
            name,
            McpBlock {
                start,
                end: lines.len(),
            },
        );
    }

    McpDocument { lines, blocks }
}

fn parse_mcp_section_header(header: &str) -> Option<(String, Option<String>)> {
    let stripped = header.strip_prefix("mcp_servers.")?;
    if stripped.is_empty() {
        return None;
    }

    if stripped.starts_with('"') {
        let mut name = String::new();
        let mut escaped = false;
        for ch in stripped[1..].chars() {
            if escaped {
                name.push(ch);
                escaped = false;
                continue;
            }
            if ch == '\\' {
                escaped = true;
                continue;
            }
            if ch == '"' {
                let rest = &stripped[name.len() + 2..];
                let sub = if rest.starts_with('.') {
                    Some(rest[1..].to_string())
                } else {
                    None
                };
                return Some((name, sub));
            }
            name.push(ch);
        }
        return None;
    }

    let parts: Vec<&str> = stripped.splitn(2, '.').collect();
    let name = parts[0].to_string();
    if name.is_empty() {
        return None;
    }
    let sub = parts.get(1).map(|s| s.to_string());
    Some((name, sub))
}

fn strip_toml_comment(line: &str) -> &str {
    let mut in_quotes = false;
    let mut escaped = false;
    for (i, ch) in line.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        if ch == '"' {
            in_quotes = !in_quotes;
            continue;
        }
        if ch == '#' && !in_quotes {
            return &line[..i];
        }
    }
    line
}

fn parse_mcp_servers(text: &str, source_path: &str) -> Vec<McpServerSummary> {
    struct Builder {
        name: String,
        transport: McpTransport,
        enabled: bool,
        command: Option<String>,
        args: Vec<String>,
        url: Option<String>,
        headers: HashMap<String, String>,
        environment: HashMap<String, String>,
    }

    let mut builders: HashMap<String, Builder> = HashMap::new();
    let mut current_server: Option<String> = None;
    let mut current_subsection: Option<String> = None;

    for line in text.lines() {
        let trimmed = strip_toml_comment(line).trim().to_string();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            let header = &trimmed[1..trimmed.len() - 1];
            if let Some((name, sub)) = parse_mcp_section_header(header) {
                current_server = Some(name.clone());
                current_subsection = sub;
                builders.entry(name.clone()).or_insert(Builder {
                    name,
                    transport: McpTransport::Unknown,
                    enabled: true,
                    command: None,
                    args: vec![],
                    url: None,
                    headers: HashMap::new(),
                    environment: HashMap::new(),
                });
            } else {
                current_server = None;
                current_subsection = None;
            }
            continue;
        }

        let Some(ref server_name) = current_server else {
            continue;
        };
        let Some(eq_pos) = trimmed.find('=') else {
            continue;
        };
        let key = trimmed[..eq_pos].trim();
        let value = trimmed[eq_pos + 1..].trim();
        let Some(builder) = builders.get_mut(server_name) else {
            continue;
        };

        match current_subsection.as_deref() {
            None => match key {
                "transport" | "type" => {
                    builder.transport = match unquote_toml(value).to_lowercase().as_str() {
                        "stdio" => McpTransport::Stdio,
                        "http" => McpTransport::Http,
                        "sse" => McpTransport::Sse,
                        _ => McpTransport::Unknown,
                    };
                }
                "command" => {
                    builder.command = Some(unquote_toml(value));
                    if matches!(builder.transport, McpTransport::Unknown) {
                        builder.transport = McpTransport::Stdio;
                    }
                }
                "args" => {
                    builder.args = parse_toml_array(value);
                    if matches!(builder.transport, McpTransport::Unknown)
                        && !builder.args.is_empty()
                    {
                        builder.transport = McpTransport::Stdio;
                    }
                }
                "url" => {
                    let u = unquote_toml(value);
                    if matches!(builder.transport, McpTransport::Unknown) {
                        builder.transport = if u.to_lowercase().contains("sse") {
                            McpTransport::Sse
                        } else {
                            McpTransport::Http
                        };
                    }
                    builder.url = Some(u);
                }
                "enabled" => builder.enabled = value.to_lowercase() == "true",
                _ => {}
            },
            Some("env") => {
                builder
                    .environment
                    .insert(key.to_string(), unquote_toml(value));
            }
            Some("headers") => {
                builder.headers.insert(key.to_string(), unquote_toml(value));
            }
            _ => {}
        }
    }

    let mut servers: Vec<McpServerSummary> = builders
        .into_values()
        .map(|b| McpServerSummary {
            name: b.name,
            transport: b.transport,
            enabled: b.enabled,
            source_path: source_path.to_string(),
            command: b.command,
            args: b.args,
            url: b.url,
            headers: b.headers,
            environment: b.environment,
        })
        .collect();
    servers.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    servers
}

fn unquote_toml(value: &str) -> String {
    let t = value.trim();
    if t.len() >= 2
        && ((t.starts_with('"') && t.ends_with('"')) || (t.starts_with('\'') && t.ends_with('\'')))
    {
        t[1..t.len() - 1].to_string()
    } else {
        t.to_string()
    }
}

fn parse_toml_array(value: &str) -> Vec<String> {
    let t = value.trim();
    if !(t.starts_with('[') && t.ends_with(']')) {
        return vec![];
    }
    let inner = &t[1..t.len() - 1];
    let mut items = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut escaped = false;
    for ch in inner.chars() {
        if escaped {
            current.push(ch);
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        if ch == '"' {
            in_quotes = !in_quotes;
            continue;
        }
        if ch == ',' && !in_quotes {
            let v = current.trim().to_string();
            if !v.is_empty() {
                items.push(v);
            }
            current.clear();
            continue;
        }
        current.push(ch);
    }
    let trailing = current.trim().to_string();
    if !trailing.is_empty() {
        items.push(trailing);
    }
    items
}

fn load_config_text(path: &Path) -> Result<String, CoreError> {
    if !path.exists() {
        return Ok(String::new());
    }
    Ok(std::fs::read_to_string(path)?)
}

fn save_config_text(path: &Path, text: &str) -> Result<(), CoreError> {
    let normalized = if text.is_empty() || text.ends_with('\n') {
        text.to_string()
    } else {
        format!("{text}\n")
    };
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, normalized.as_bytes())?;
    std::fs::rename(&tmp, path)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    const BOTTOM_MANAGED_BLOCK_END: &str = "# --- End AiMaMi Managed Block (bottom) ---";
    const ROUTER_TOP_MANAGED_BLOCK_END: &str = "# --- End AiMaMi Managed Block (router-top) ---";

    fn stdio_server(name: &str) -> McpServerSummary {
        McpServerSummary {
            name: name.into(),
            transport: McpTransport::Stdio,
            enabled: true,
            source_path: String::new(),
            command: Some("npx".into()),
            args: vec!["-y".into(), "@upstash/context7-mcp@latest".into()],
            url: None,
            headers: HashMap::new(),
            environment: HashMap::new(),
        }
    }

    fn temp_config_path(test_name: &str) -> std::path::PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!(
            "aimami-mcp-{test_name}-{}-{nanos}.toml",
            std::process::id()
        ))
    }

    #[test]
    fn upsert_mcp_keeps_router_top_block_before_mcp_table() {
        let path = temp_config_path("router-top");
        let original = format!(
            "{ROUTER_TOP_MANAGED_BLOCK_BEGIN}\n\
             profile = \"aimai1\"\n\
             model_catalog_json = \"/tmp/catalog.json\"\n\
             {ROUTER_TOP_MANAGED_BLOCK_END}\n\n\
             {BOTTOM_MANAGED_BLOCK_BEGIN}\n\
             [model_providers.aimai1]\n\
             name = \"AiMaMi 智能路由\"\n\
             {BOTTOM_MANAGED_BLOCK_END}\n"
        );
        std::fs::write(&path, original).unwrap();

        upsert_mcp_server(&path, &stdio_server("context7")).unwrap();
        let updated = std::fs::read_to_string(&path).unwrap();

        let top_pos = updated.find(ROUTER_TOP_MANAGED_BLOCK_BEGIN).unwrap();
        let mcp_pos = updated.find("[mcp_servers.\"context7\"]").unwrap();
        let bottom_pos = updated.find(BOTTOM_MANAGED_BLOCK_BEGIN).unwrap();
        assert!(top_pos < mcp_pos);
        assert!(mcp_pos < bottom_pos);

        let parsed: toml::Value = updated.parse().expect("config must remain valid TOML");
        assert_eq!(parsed["profile"].as_str(), Some("aimai1"));
        assert_eq!(
            parsed["mcp_servers"]["context7"]["command"].as_str(),
            Some("npx")
        );

        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn upsert_mcp_relocates_existing_block_out_of_managed_block() {
        let path = temp_config_path("relocate");
        let original = format!(
            "{BOTTOM_MANAGED_BLOCK_BEGIN}\n\
             [model_providers.test_provider]\n\
             name = \"X\"\n\n\
             [mcp_servers.context7]\n\
             command = \"old\"\n\n\
             [profiles.test_provider]\n\
             model_provider = \"test_provider\"\n\
             {BOTTOM_MANAGED_BLOCK_END}\n"
        );
        std::fs::write(&path, original).unwrap();

        let mut server = stdio_server("context7");
        server.enabled = false;
        upsert_mcp_server(&path, &server).unwrap();
        let updated = std::fs::read_to_string(&path).unwrap();

        let mcp_pos = updated.find("[mcp_servers.\"context7\"]").unwrap();
        let bottom_pos = updated.find(BOTTOM_MANAGED_BLOCK_BEGIN).unwrap();
        assert!(mcp_pos < bottom_pos);
        assert!(updated.contains("enabled = false"));
        assert!(!updated.contains("command = \"old\""));

        let managed_block = &updated[bottom_pos..];
        assert!(!managed_block.contains("[mcp_servers.\"context7\"]"));

        let _ = std::fs::remove_file(path);
    }
}
