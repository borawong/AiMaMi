use crate::core::models::{AutoSwitchRuntimeState, CoreError};
use std::path::{Path, PathBuf};

#[cfg(target_os = "macos")]
const MACOS_DAEMON_LABEL: &str = "dev.aimami.auto-switch";
#[cfg(target_os = "macos")]
const LEGACY_MACOS_DAEMON_LABEL: &str = "dev.aimami.legacy-auto-switch";
#[cfg(target_os = "macos")]
const LEGACY_MACOS_DAEMON_PLIST: &str = "dev.aimami.legacy-auto-switch.plist";
#[cfg(target_os = "macos")]
static LEGACY_DAEMON_CLEANUP: std::sync::Once = std::sync::Once::new();

#[cfg(target_os = "macos")]
pub fn check_daemon_state(plist_path: &Path) -> AutoSwitchRuntimeState {
    cleanup_legacy_macos_daemon();
    if !plist_path.exists() {
        return AutoSwitchRuntimeState::NotInstalled;
    }
    if launchctl_label_exists(MACOS_DAEMON_LABEL) {
        AutoSwitchRuntimeState::Running
    } else {
        AutoSwitchRuntimeState::Stopped
    }
}

#[cfg(target_os = "windows")]
pub fn check_daemon_state(_plist_path: &Path) -> AutoSwitchRuntimeState {
    match query_windows_task_state("CodexMateAutoSwitch") {
        Some(state) if state.eq_ignore_ascii_case("running") => AutoSwitchRuntimeState::Running,
        Some(_) => AutoSwitchRuntimeState::Stopped,
        None => AutoSwitchRuntimeState::NotInstalled,
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn check_daemon_state(_plist_path: &Path) -> AutoSwitchRuntimeState {
    AutoSwitchRuntimeState::NotInstalled
}

#[cfg(target_os = "macos")]
pub fn install_daemon(
    plist_path: &Path,
    app_binary: &Path,
    codex_home: &Path,
) -> Result<(), CoreError> {
    cleanup_legacy_macos_daemon();
    let plist_content = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{}</string>
        <string>daemon-run-once</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>CODEX_HOME</key>
        <string>{}</string>
    </dict>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/codexmate-auto-switch.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/codexmate-auto-switch-error.log</string>
</dict>
</plist>"#,
        MACOS_DAEMON_LABEL,
        app_binary.display(),
        codex_home.display()
    );

    if let Some(parent) = plist_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(plist_path, plist_content)?;

    std::process::Command::new("launchctl")
        .args(["load", "-w"])
        .arg(plist_path)
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("launchctl load failed: {e}")))?;

    Ok(())
}

#[cfg(target_os = "macos")]
pub fn uninstall_daemon(plist_path: &Path) -> Result<(), CoreError> {
    cleanup_legacy_macos_daemon();
    if plist_path.exists() {
        let _ = std::process::Command::new("launchctl")
            .args(["unload", "-w"])
            .arg(plist_path)
            .output();
        std::fs::remove_file(plist_path)?;
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn launchctl_label_exists(label: &str) -> bool {
    std::process::Command::new("launchctl")
        .args(["list", label])
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

#[cfg(target_os = "macos")]
fn cleanup_legacy_macos_daemon() {
    LEGACY_DAEMON_CLEANUP.call_once(|| {
        if let Some(path) = legacy_macos_daemon_path() {
            if path.exists() {
                let _ = std::process::Command::new("launchctl")
                    .args(["unload", "-w"])
                    .arg(&path)
                    .output();
                let _ = std::fs::remove_file(path);
            }
        }

        let _ = std::process::Command::new("launchctl")
            .args(["remove", LEGACY_MACOS_DAEMON_LABEL])
            .output();
    });
}

#[cfg(target_os = "macos")]
fn legacy_macos_daemon_path() -> Option<PathBuf> {
    dirs::home_dir().map(|home| {
        home.join("Library")
            .join("LaunchAgents")
            .join(LEGACY_MACOS_DAEMON_PLIST)
    })
}

#[cfg(target_os = "windows")]
pub fn install_daemon(
    _plist_path: &Path,
    app_binary: &Path,
    codex_home: &Path,
) -> Result<(), CoreError> {
    let task_command = windows_task_command(app_binary, codex_home);
    let output = crate::platform::windows::background_command("schtasks")
        .args([
            "/Create",
            "/SC",
            "MINUTE",
            "/MO",
            "5",
            "/TN",
            "CodexMateAutoSwitch",
            "/TR",
            &task_command,
            "/F",
        ])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("schtasks create failed: {e}")))?;
    if !output.status.success() {
        return Err(CoreError::OperationFailed(format!(
            "schtasks create failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        )));
    }
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn uninstall_daemon(_plist_path: &Path) -> Result<(), CoreError> {
    let _ = crate::platform::windows::background_command("schtasks")
        .args(["/Delete", "/TN", "CodexMateAutoSwitch", "/F"])
        .output();
    Ok(())
}

#[cfg(target_os = "windows")]
fn query_windows_task_state(task_name: &str) -> Option<String> {
    let powershell = crate::platform::windows::background_command("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!(
                "(Get-ScheduledTask -TaskName '{task_name}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty State)"
            ),
        ])
        .output()
        .ok()?;

    if powershell.status.success() {
        let stdout = String::from_utf8_lossy(&powershell.stdout);
        let value = stdout.trim();
        if !value.is_empty() {
            return Some(value.to_string());
        }
    }

    let schtasks = crate::platform::windows::background_command("schtasks")
        .args(["/Query", "/TN", task_name, "/FO", "LIST"])
        .output()
        .ok()?;

    if !schtasks.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&schtasks.stdout);
    if stdout.contains("Running") {
        return Some("Running".to_string());
    }

    Some("Ready".to_string())
}

#[cfg(target_os = "windows")]
fn windows_task_command(app_binary: &Path, codex_home: &Path) -> String {
    let app_binary = windows_powershell_literal(app_binary.to_string_lossy().as_ref());
    let codex_home = windows_powershell_literal(codex_home.to_string_lossy().as_ref());
    format!(
        "powershell -NoProfile -WindowStyle Hidden -Command \"$env:CODEX_HOME='{codex_home}'; & '{app_binary}' daemon-run-once\""
    )
}

#[cfg(target_os = "windows")]
fn windows_powershell_literal(value: &str) -> String {
    value.replace('\'', "''")
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn install_daemon(
    _plist_path: &Path,
    _app_binary: &Path,
    _codex_home: &Path,
) -> Result<(), CoreError> {
    Err(CoreError::OperationFailed(
        "Daemon not supported on this platform".to_string(),
    ))
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn uninstall_daemon(_plist_path: &Path) -> Result<(), CoreError> {
    Ok(())
}
