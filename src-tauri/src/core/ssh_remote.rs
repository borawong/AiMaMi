use crate::core::auth::current_timestamp;
use crate::core::models::{
    CoreError, SshConnectionTestPayload, SshServerConfig, SshServerListPayload, SshServerSummary,
    SshSyncPayload, SshSyncResult, SshSyncStatus,
};
use crate::platform::paths::CodexPaths;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use std::time::Instant;
use uuid::Uuid;

const SCHEMA_VERSION: i32 = 1;
const CONNECT_TIMEOUT_SECONDS: &str = "8";
const DEFAULT_REMOTE_CODEX_HOME: &str = "~/.codex";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct RemoteServersFile {
    #[serde(default = "default_schema_version")]
    schema_version: i32,
    #[serde(default)]
    updated_at: i64,
    #[serde(default)]
    items: Vec<SshServerSummary>,
}

fn default_schema_version() -> i32 {
    SCHEMA_VERSION
}

pub fn load_servers(paths: &CodexPaths) -> Result<SshServerListPayload, CoreError> {
    let file = load_file(&paths.remote_servers_path)?;
    Ok(SshServerListPayload {
        items: file.items.clone(),
        total: file.items.len() as i32,
        source_path: paths.remote_servers_path.display().to_string(),
        last_scan_at: current_timestamp(),
    })
}

pub fn upsert_server(
    paths: &CodexPaths,
    id: Option<String>,
    config: SshServerConfig,
) -> Result<SshServerSummary, CoreError> {
    validate_config(&config)?;
    let mut file = load_file(&paths.remote_servers_path)?;
    let now = current_timestamp();
    let normalized = normalize_config(config);

    let saved = if let Some(id) = id.filter(|v| !v.trim().is_empty()) {
        if let Some(existing) = file.items.iter_mut().find(|item| item.id == id) {
            existing.alias = normalized.alias;
            existing.host = normalized.host;
            existing.user = normalized.user;
            existing.port = normalized.port;
            existing.key_path = normalized.key_path;
            existing.remote_codex_home = normalized.remote_codex_home;
            existing.enabled = normalized.enabled;
            existing.updated_at = now;
            existing.clone()
        } else {
            let item = make_summary_with_id(id, normalized, now);
            file.items.push(item.clone());
            item
        }
    } else {
        let item = make_summary_with_id(Uuid::new_v4().to_string(), normalized, now);
        file.items.push(item.clone());
        item
    };

    file.items
        .sort_by(|a, b| a.alias.to_lowercase().cmp(&b.alias.to_lowercase()));
    save_file(&paths.remote_servers_path, &mut file)?;
    Ok(saved)
}

pub fn remove_server(paths: &CodexPaths, id: &str) -> Result<SshServerSummary, CoreError> {
    let mut file = load_file(&paths.remote_servers_path)?;
    let index = file
        .items
        .iter()
        .position(|item| item.id == id)
        .ok_or_else(|| CoreError::NotFound(format!("SSH server not found: {id}")))?;
    let removed = file.items.remove(index);
    save_file(&paths.remote_servers_path, &mut file)?;
    Ok(removed)
}

pub fn test_server(
    paths: &CodexPaths,
    id: Option<&str>,
    draft: Option<SshServerConfig>,
) -> Result<SshConnectionTestPayload, CoreError> {
    let server = resolve_server_or_draft(paths, id, draft)?;
    let start = Instant::now();
    let output = run_ssh_command(&server, "printf aimami-ssh-ok", true);
    let elapsed_ms = start.elapsed().as_millis() as i64;

    match output {
        Ok(output) if output.status.success() => Ok(SshConnectionTestPayload {
            server_id: Some(server.id),
            reachable: true,
            code: "ok".into(),
            message: "SSH connection successful".into(),
            elapsed_ms,
        }),
        Ok(output) => Ok(SshConnectionTestPayload {
            server_id: Some(server.id),
            reachable: false,
            code: "ssh_failed".into(),
            message: output_message(&output),
            elapsed_ms,
        }),
        Err(error) => Ok(SshConnectionTestPayload {
            server_id: Some(server.id),
            reachable: false,
            code: "command_failed".into(),
            message: error.to_string(),
            elapsed_ms,
        }),
    }
}

pub fn sync_server(paths: &CodexPaths, id: &str) -> Result<SshSyncPayload, CoreError> {
    let mut file = load_file(&paths.remote_servers_path)?;
    let Some(index) = file.items.iter().position(|item| item.id == id) else {
        return Err(CoreError::NotFound(format!("SSH server not found: {id}")));
    };
    let server = file.items[index].clone();
    let result = sync_single(paths, &server);
    update_server_sync_status(&mut file.items[index], &result);
    save_file(&paths.remote_servers_path, &mut file)?;
    Ok(SshSyncPayload {
        results: vec![result],
    })
}

pub fn sync_all_enabled(paths: &CodexPaths) -> Result<SshSyncPayload, CoreError> {
    let mut file = load_file(&paths.remote_servers_path)?;
    let mut results = Vec::new();

    for item in &mut file.items {
        if !item.enabled {
            continue;
        }
        let result = sync_single(paths, item);
        update_server_sync_status(item, &result);
        results.push(result);
    }

    save_file(&paths.remote_servers_path, &mut file)?;
    Ok(SshSyncPayload { results })
}

pub fn sync_all_enabled_best_effort(paths: &CodexPaths) -> Vec<crate::core::models::CoreWarning> {
    match sync_all_enabled(paths) {
        Ok(payload) => payload
            .results
            .into_iter()
            .filter(|result| result.status != SshSyncStatus::Success)
            .map(|result| crate::core::models::CoreWarning {
                code: "SSH_REMOTE_SYNC_FAILED".into(),
                message: format!(
                    "Remote sync failed for {}: {}",
                    result.alias,
                    result.message.unwrap_or_else(|| "unknown error".into())
                ),
            })
            .collect(),
        Err(error) => vec![crate::core::models::CoreWarning {
            code: "SSH_REMOTE_SYNC_FAILED".into(),
            message: format!("Remote sync failed: {error}"),
        }],
    }
}

pub fn open_server(paths: &CodexPaths, id: &str) -> Result<(), CoreError> {
    let server = load_file(&paths.remote_servers_path)?
        .items
        .into_iter()
        .find(|item| item.id == id)
        .ok_or_else(|| CoreError::NotFound(format!("SSH server not found: {id}")))?;
    let command = open_terminal_command(&server);
    crate::platform::process::open_terminal_with_command(&command)
}

fn sync_single(paths: &CodexPaths, server: &SshServerSummary) -> SshSyncResult {
    let started_at = current_timestamp();
    if !server.enabled {
        return SshSyncResult {
            server_id: server.id.clone(),
            alias: server.alias.clone(),
            status: SshSyncStatus::Skipped,
            message: Some("Server disabled".into()),
            synced_at: None,
        };
    }

    if let Err(error) = ensure_rsync_available() {
        return failed_result(server, started_at, error.to_string());
    }

    let remote_home = normalized_remote_home(server);
    if let Err(error) = prepare_remote(server, &remote_home) {
        return failed_result(server, started_at, error.to_string());
    }

    if let Err(error) = run_rsync(paths, server, &remote_home) {
        return failed_result(server, started_at, error.to_string());
    }

    if let Err(error) = verify_remote(server, &remote_home) {
        return failed_result(server, started_at, error.to_string());
    }

    SshSyncResult {
        server_id: server.id.clone(),
        alias: server.alias.clone(),
        status: SshSyncStatus::Success,
        message: Some("Sync completed".into()),
        synced_at: Some(current_timestamp()),
    }
}

fn failed_result(server: &SshServerSummary, _started_at: i64, message: String) -> SshSyncResult {
    SshSyncResult {
        server_id: server.id.clone(),
        alias: server.alias.clone(),
        status: SshSyncStatus::Failed,
        message: Some(message),
        synced_at: None,
    }
}

fn ensure_rsync_available() -> Result<(), CoreError> {
    let output = Command::new("rsync")
        .arg("--version")
        .output()
        .map_err(|e| {
            CoreError::OperationFailed(format!(
                "rsync is required for remote Codex sync but was not found locally: {e}"
            ))
        })?;
    if output.status.success() {
        Ok(())
    } else {
        Err(CoreError::OperationFailed(
            "rsync is required for remote Codex sync but is not working locally".into(),
        ))
    }
}

fn prepare_remote(server: &SshServerSummary, remote_home: &str) -> Result<(), CoreError> {
    let script = format!(
        "command -v rsync >/dev/null 2>&1 || {{ echo 'rsync is required on the remote server'; exit 127; }}; mkdir -p {}",
        remote_path_arg(remote_home)
    );
    let remote_command = format!("sh -lc {}", shell_quote(&script));
    let output = run_ssh_command(server, &remote_command, false)?;
    if output.status.success() {
        Ok(())
    } else {
        Err(CoreError::OperationFailed(output_message(&output)))
    }
}

fn verify_remote(server: &SshServerSummary, remote_home: &str) -> Result<(), CoreError> {
    let script = format!(
        "test -d {} && (test -f {}/config.toml || test -f {}/auth.json || test -d {}/accounts || test -d {}/skills || true)",
        remote_path_arg(remote_home),
        remote_path_arg(remote_home),
        remote_path_arg(remote_home),
        remote_path_arg(remote_home),
        remote_path_arg(remote_home)
    );
    let remote_command = format!("sh -lc {}", shell_quote(&script));
    let output = run_ssh_command(server, &remote_command, false)?;
    if output.status.success() {
        Ok(())
    } else {
        Err(CoreError::OperationFailed(output_message(&output)))
    }
}

fn run_rsync(
    paths: &CodexPaths,
    server: &SshServerSummary,
    remote_home: &str,
) -> Result<(), CoreError> {
    let source = source_path_with_trailing_slash(&paths.codex_home);
    let target = format!("{}:{}/", ssh_target(server), rsync_remote_path(remote_home));
    let ssh = rsync_ssh_command(server);
    let mut cmd = Command::new("rsync");
    cmd.args(["-az", "--delete", "--human-readable"]);
    for pattern in rsync_excludes() {
        cmd.arg("--exclude").arg(pattern);
    }
    cmd.arg("-e").arg(ssh).arg(source).arg(target);
    let output = cmd.output().map_err(|e| {
        CoreError::OperationFailed(format!("failed to start rsync for {}: {e}", server.alias))
    })?;
    if output.status.success() {
        Ok(())
    } else {
        Err(CoreError::OperationFailed(output_message(&output)))
    }
}

fn update_server_sync_status(server: &mut SshServerSummary, result: &SshSyncResult) {
    server.last_sync_status = Some(result.status.clone());
    server.last_synced_at = result.synced_at;
    server.last_error = if result.status == SshSyncStatus::Failed {
        result.message.clone()
    } else {
        None
    };
    server.updated_at = current_timestamp();
}

fn resolve_server_or_draft(
    paths: &CodexPaths,
    id: Option<&str>,
    draft: Option<SshServerConfig>,
) -> Result<SshServerSummary, CoreError> {
    if let Some(id) = id.filter(|v| !v.trim().is_empty()) {
        return load_file(&paths.remote_servers_path)?
            .items
            .into_iter()
            .find(|item| item.id == id)
            .ok_or_else(|| CoreError::NotFound(format!("SSH server not found: {id}")));
    }
    let draft = draft.ok_or_else(|| CoreError::InvalidData("Missing SSH server config".into()))?;
    validate_config(&draft)?;
    Ok(make_summary_with_id(
        "draft".into(),
        normalize_config(draft),
        current_timestamp(),
    ))
}

fn load_file(path: &Path) -> Result<RemoteServersFile, CoreError> {
    let raw = match std::fs::read_to_string(path) {
        Ok(raw) => raw,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            return Ok(RemoteServersFile {
                schema_version: SCHEMA_VERSION,
                updated_at: 0,
                items: vec![],
            })
        }
        Err(err) => return Err(err.into()),
    };
    let mut file: RemoteServersFile = serde_json::from_str(&raw)?;
    file.schema_version = file.schema_version.max(SCHEMA_VERSION);
    Ok(file)
}

fn save_file(path: &Path, file: &mut RemoteServersFile) -> Result<(), CoreError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    file.schema_version = file.schema_version.max(SCHEMA_VERSION);
    file.updated_at = current_timestamp();
    std::fs::write(path, serde_json::to_string_pretty(file)?)?;
    Ok(())
}

fn make_summary_with_id(id: String, config: SshServerConfig, now: i64) -> SshServerSummary {
    SshServerSummary {
        id,
        alias: config.alias,
        host: config.host,
        user: config.user,
        port: config.port,
        key_path: config.key_path,
        remote_codex_home: config.remote_codex_home,
        enabled: config.enabled,
        last_sync_status: None,
        last_synced_at: None,
        last_error: None,
        created_at: now,
        updated_at: now,
    }
}

fn validate_config(config: &SshServerConfig) -> Result<(), CoreError> {
    if config.alias.trim().is_empty() {
        return Err(CoreError::InvalidData(
            "SSH server alias is required".into(),
        ));
    }
    if config.host.trim().is_empty() {
        return Err(CoreError::InvalidData("SSH host is required".into()));
    }
    if let Some(port) = config.port {
        if port == 0 {
            return Err(CoreError::InvalidData(
                "SSH port must be greater than 0".into(),
            ));
        }
    }
    Ok(())
}

fn normalize_config(mut config: SshServerConfig) -> SshServerConfig {
    config.alias = config.alias.trim().to_string();
    config.host = config.host.trim().to_string();
    config.user = config.user.and_then(|v| non_empty_trimmed(&v));
    config.key_path = config.key_path.and_then(|v| non_empty_trimmed(&v));
    config.remote_codex_home = non_empty_trimmed(&config.remote_codex_home)
        .unwrap_or_else(|| DEFAULT_REMOTE_CODEX_HOME.into());
    config
}

fn non_empty_trimmed(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

fn run_ssh_command(
    server: &SshServerSummary,
    remote_command: &str,
    batch_mode: bool,
) -> Result<Output, CoreError> {
    let mut cmd = Command::new("ssh");
    append_ssh_options(&mut cmd, server, batch_mode);
    cmd.arg(ssh_target(server));
    cmd.arg(remote_command);
    cmd.output()
        .map_err(|e| CoreError::OperationFailed(format!("failed to start ssh: {e}")))
}

fn append_ssh_options(cmd: &mut Command, server: &SshServerSummary, batch_mode: bool) {
    cmd.arg("-o")
        .arg(format!("ConnectTimeout={CONNECT_TIMEOUT_SECONDS}"));
    if batch_mode {
        cmd.arg("-o").arg("BatchMode=yes");
    }
    if let Some(port) = server.port {
        cmd.arg("-p").arg(port.to_string());
    }
    if let Some(key_path) = &server.key_path {
        cmd.arg("-i").arg(expand_tilde(key_path));
    }
}

fn rsync_ssh_command(server: &SshServerSummary) -> String {
    let mut parts = vec![
        "ssh".to_string(),
        "-o".into(),
        format!("ConnectTimeout={CONNECT_TIMEOUT_SECONDS}"),
    ];
    if let Some(port) = server.port {
        parts.push("-p".into());
        parts.push(port.to_string());
    }
    if let Some(key_path) = &server.key_path {
        parts.push("-i".into());
        parts.push(expand_tilde(key_path).display().to_string());
    }
    parts
        .into_iter()
        .map(|part| shell_quote(&part))
        .collect::<Vec<_>>()
        .join(" ")
}

fn open_terminal_command(server: &SshServerSummary) -> String {
    let mut parts = vec!["ssh".to_string()];
    if let Some(port) = server.port {
        parts.push("-p".into());
        parts.push(port.to_string());
    }
    if let Some(key_path) = &server.key_path {
        parts.push("-i".into());
        parts.push(expand_tilde(key_path).display().to_string());
    }
    parts.push("-t".into());
    parts.push(ssh_target(server));
    parts.push(format!(
        "cd {} 2>/dev/null || true; export CODEX_HOME={}; exec $SHELL -l",
        remote_path_arg(&normalized_remote_home(server)),
        remote_path_arg(&normalized_remote_home(server))
    ));
    parts
        .into_iter()
        .map(|part| shell_quote(&part))
        .collect::<Vec<_>>()
        .join(" ")
}

fn ssh_target(server: &SshServerSummary) -> String {
    match &server.user {
        Some(user) if !user.is_empty() => format!("{user}@{}", server.host),
        _ => server.host.clone(),
    }
}

fn normalized_remote_home(server: &SshServerSummary) -> String {
    if server.remote_codex_home.trim().is_empty() {
        DEFAULT_REMOTE_CODEX_HOME.into()
    } else {
        server.remote_codex_home.trim().to_string()
    }
}

fn source_path_with_trailing_slash(path: &Path) -> String {
    let mut text = path.display().to_string();
    if !text.ends_with(std::path::MAIN_SEPARATOR) {
        text.push(std::path::MAIN_SEPARATOR);
    }
    text
}

fn expand_tilde(path: &str) -> PathBuf {
    if path == "~" {
        return dirs::home_dir().unwrap_or_else(|| PathBuf::from(path));
    }
    if let Some(rest) = path.strip_prefix("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(rest);
        }
    }
    PathBuf::from(path)
}

fn output_message(output: &Output) -> String {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if !stderr.is_empty() {
        return stderr;
    }
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if !stdout.is_empty() {
        return stdout;
    }
    format!("command exited with status {}", output.status)
}

fn rsync_excludes() -> Vec<&'static str> {
    vec![
        "codexmate/remote-servers.json",
        "codexmate/auto-switch-pending.json",
        "codexmate/auto-switch-snooze.json",
        "codexmate/bootstrap-cache.json",
        "accounts/auto-switch.log",
        "accounts/registry-backups/",
        "**/.DS_Store",
        "**/Thumbs.db",
        "**/*.tmp",
        "**/*.log",
    ]
}

fn remote_path_arg(value: &str) -> String {
    if value == "~" {
        return "\"$HOME\"".into();
    }
    if let Some(rest) = value.strip_prefix("~/") {
        return format!("\"$HOME/{}\"", rest.replace('"', "\\\""));
    }
    shell_quote(value)
}

fn rsync_remote_path(value: &str) -> String {
    if value == "~" {
        return "$HOME".into();
    }
    if let Some(rest) = value.strip_prefix("~/") {
        return format!("$HOME/{rest}");
    }
    value.to_string()
}

fn shell_quote(value: &str) -> String {
    if value.is_empty() {
        return "''".into();
    }
    format!("'{}'", value.replace('\'', "'\\''"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_server() -> SshServerSummary {
        make_summary_with_id(
            "id".into(),
            SshServerConfig {
                alias: "Prod".into(),
                host: "example.com".into(),
                user: Some("ubuntu".into()),
                port: Some(2222),
                key_path: Some("~/.ssh/id_ed25519".into()),
                remote_codex_home: "~/.codex".into(),
                enabled: true,
            },
            1,
        )
    }

    #[test]
    fn target_includes_user_when_present() {
        assert_eq!(ssh_target(&sample_server()), "ubuntu@example.com");
    }

    #[test]
    fn rsync_excludes_remote_registry() {
        assert!(rsync_excludes().contains(&"codexmate/remote-servers.json"));
    }

    #[test]
    fn shell_quote_handles_single_quotes() {
        assert_eq!(shell_quote("a'b"), "'a'\\''b'");
    }

    #[test]
    fn normalizes_empty_remote_home() {
        let config = normalize_config(SshServerConfig {
            alias: " a ".into(),
            host: " h ".into(),
            user: Some(" ".into()),
            port: None,
            key_path: None,
            remote_codex_home: " ".into(),
            enabled: true,
        });
        assert_eq!(config.alias, "a");
        assert_eq!(config.host, "h");
        assert_eq!(config.remote_codex_home, DEFAULT_REMOTE_CODEX_HOME);
        assert!(config.user.is_none());
    }

    #[test]
    fn rsync_remote_path_expands_home() {
        assert_eq!(rsync_remote_path("~/.codex"), "$HOME/.codex");
        assert_eq!(rsync_remote_path("/srv/codex"), "/srv/codex");
    }

    #[test]
    fn upsert_persists_server_config() {
        let codex_home = std::env::temp_dir().join(format!(
            "aimami-ssh-remote-test-{}-{}",
            std::process::id(),
            current_timestamp()
        ));
        let paths = CodexPaths::from_home(codex_home.clone());
        let saved = upsert_server(
            &paths,
            None,
            SshServerConfig {
                alias: "Dev".into(),
                host: "devbox".into(),
                user: None,
                port: None,
                key_path: None,
                remote_codex_home: "".into(),
                enabled: true,
            },
        )
        .unwrap();
        let loaded = load_servers(&paths).unwrap();
        assert_eq!(loaded.total, 1);
        assert_eq!(loaded.items[0].id, saved.id);
        assert_eq!(loaded.items[0].remote_codex_home, DEFAULT_REMOTE_CODEX_HOME);
        let _ = std::fs::remove_dir_all(codex_home);
    }
}
