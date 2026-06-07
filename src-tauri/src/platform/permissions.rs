use crate::application::ports::PermissionsPort;
use crate::core::error::CoreError;
use std::process::Command;

#[derive(Default)]
pub(crate) struct SystemPermissions;

impl PermissionsPort for SystemPermissions {
    fn open_privacy_pane(&self, pane: &str) -> Result<(), CoreError> {
        let pane = sanitize_pane(pane)?;
        let mut command = privacy_pane_command(&pane)?;
        command.spawn().map(|_| ()).map_err(|error| {
            CoreError::platform("privacy_pane_open_failed", "打开权限设置面板失败。")
                .with_diagnostic(error.to_string())
        })
    }
}

#[derive(Default)]
pub(crate) struct NoopPermissions;

impl PermissionsPort for NoopPermissions {
    fn open_privacy_pane(&self, _pane: &str) -> Result<(), CoreError> {
        Ok(())
    }
}

fn sanitize_pane(pane: &str) -> Result<String, CoreError> {
    let value = pane.trim();
    if value.is_empty()
        || !value
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.'))
    {
        return Err(CoreError::domain(
            "invalid_privacy_pane",
            "权限设置面板标识无效。",
        ));
    }

    Ok(value.to_owned())
}

#[cfg(target_os = "windows")]
fn privacy_pane_command(pane: &str) -> Result<Command, CoreError> {
    use std::os::windows::process::CommandExt;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut command = Command::new("explorer");
    command
        .arg(format!("ms-settings:privacy-{pane}"))
        .creation_flags(CREATE_NO_WINDOW);
    Ok(command)
}

#[cfg(target_os = "macos")]
fn privacy_pane_command(pane: &str) -> Result<Command, CoreError> {
    let mut command = Command::new("open");
    command.arg(format!(
        "x-apple.systempreferences:com.apple.preference.security?Privacy_{pane}"
    ));
    Ok(command)
}

#[cfg(all(unix, not(target_os = "macos")))]
fn privacy_pane_command(_pane: &str) -> Result<Command, CoreError> {
    Err(CoreError::platform(
        "privacy_pane_unsupported",
        "当前操作系统不支持打开权限设置面板。",
    ))
}
