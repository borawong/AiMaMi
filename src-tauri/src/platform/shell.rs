use crate::application::ports::ShellPort;
use crate::core::error::CoreError;
use std::path::Path;
use std::process::Command;

#[derive(Default)]
pub(crate) struct SystemShell;

impl ShellPort for SystemShell {
    fn open_path(&self, path: &str) -> Result<(), CoreError> {
        if !Path::new(path).exists() {
            return Err(CoreError::repository(
                "open_path_missing",
                "要打开的路径不存在。",
            ));
        }

        spawn_open_path(path)
    }
}

#[derive(Default)]
pub(crate) struct NoopShell;

impl ShellPort for NoopShell {
    fn open_path(&self, _path: &str) -> Result<(), CoreError> {
        Ok(())
    }
}

fn spawn_open_path(path: &str) -> Result<(), CoreError> {
    let mut command = open_path_command(path);
    command.spawn().map(|_| ()).map_err(|error| {
        CoreError::platform("open_path_failed", "打开路径失败。").with_diagnostic(error.to_string())
    })
}

#[cfg(target_os = "windows")]
fn open_path_command(path: &str) -> Command {
    use std::os::windows::process::CommandExt;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut command = Command::new("explorer");
    command.arg(path).creation_flags(CREATE_NO_WINDOW);
    command
}

#[cfg(target_os = "macos")]
fn open_path_command(path: &str) -> Command {
    let mut command = Command::new("open");
    command.arg(path);
    command
}

#[cfg(all(unix, not(target_os = "macos")))]
fn open_path_command(path: &str) -> Command {
    let mut command = Command::new("xdg-open");
    command.arg(path);
    command
}
