#[cfg(target_os = "windows")]
pub fn background_command(program: &str) -> std::process::Command {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut command = std::process::Command::new(program);
    command.creation_flags(CREATE_NO_WINDOW);
    command
}

#[cfg(not(target_os = "windows"))]
pub fn background_command(program: &str) -> std::process::Command {
    std::process::Command::new(program)
}

pub fn restart_app() -> Result<(), String> {
    Err("当前公开后端未恢复重启外部程序能力".to_string())
}

pub fn force_kill_app() -> Result<(), String> {
    Err("当前公开后端未恢复强制结束外部程序能力".to_string())
}
