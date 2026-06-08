use crate::core::error::CoreError;

pub fn open_path(path: &str) -> Result<(), CoreError> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(path).spawn()?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open").arg(path).spawn()?;
    }
    #[cfg(target_os = "windows")]
    {
        crate::platform::process::background_command("explorer")
            .arg(path)
            .spawn()?;
    }
    Ok(())
}
