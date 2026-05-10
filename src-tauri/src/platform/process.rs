use crate::core::models::CoreError;
use std::time::{Duration, Instant};

#[cfg(target_os = "windows")]
use std::path::{Path, PathBuf};
#[cfg(target_os = "windows")]
use std::sync::Mutex;

#[cfg(target_os = "windows")]
static LAST_KNOWN_CODEX_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);

#[cfg(target_os = "macos")]
pub fn kill_process(name: &str) -> Result<(), CoreError> {
    std::process::Command::new("killall")
        .args(["-9", name])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("killall failed: {e}")))?;
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn kill_process(name: &str) -> Result<(), CoreError> {
    crate::platform::windows::background_command("taskkill")
        .args(["/F", "/IM", &format!("{name}.exe")])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("taskkill failed: {e}")))?;
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn kill_process(name: &str) -> Result<(), CoreError> {
    std::process::Command::new("pkill")
        .args(["-9", name])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("pkill failed: {e}")))?;
    Ok(())
}

fn wait_for_process_exit(name: &str, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if !is_process_running(name) {
            return true;
        }
        std::thread::sleep(Duration::from_millis(50));
    }
    false
}

fn wait_for_process_start(name: &str, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if is_process_running(name) {
            return true;
        }
        std::thread::sleep(Duration::from_millis(80));
    }
    false
}

#[cfg(target_os = "macos")]
fn is_process_running(name: &str) -> bool {
    std::process::Command::new("pgrep")
        .args(["-x", name])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[cfg(target_os = "windows")]
fn is_process_running(name: &str) -> bool {
    win32_process::find_process_by_name(name).is_some()
}

#[cfg(target_os = "windows")]
mod win32_process {
    use std::path::PathBuf;
    use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
    };
    use windows_sys::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION,
    };

    pub fn find_process_by_name(name: &str) -> Option<u32> {
        let target_lower: Vec<u16> = format!("{name}.exe")
            .to_ascii_lowercase()
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();

        unsafe {
            let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snapshot == INVALID_HANDLE_VALUE {
                return None;
            }

            let mut entry: PROCESSENTRY32W = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;

            if Process32FirstW(snapshot, &mut entry) == 0 {
                CloseHandle(snapshot);
                return None;
            }

            loop {
                let exe_name_lower: Vec<u16> = entry
                    .szExeFile
                    .iter()
                    .take_while(|&&c| c != 0)
                    .map(|&c| {
                        if (b'A' as u16..=b'Z' as u16).contains(&c) {
                            c + 32
                        } else {
                            c
                        }
                    })
                    .chain(std::iter::once(0))
                    .collect();

                if exe_name_lower == target_lower {
                    let pid = entry.th32ProcessID;
                    CloseHandle(snapshot);
                    return Some(pid);
                }

                if Process32NextW(snapshot, &mut entry) == 0 {
                    break;
                }
            }

            CloseHandle(snapshot);
        }
        None
    }

    pub fn get_process_exe_path(name: &str) -> Option<PathBuf> {
        let pid = find_process_by_name(name)?;
        unsafe {
            let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
            if handle.is_null() {
                return None;
            }

            let mut buf = [0u16; 1024];
            let mut size = buf.len() as u32;
            let ok = QueryFullProcessImageNameW(handle, 0, buf.as_mut_ptr(), &mut size);
            CloseHandle(handle);

            if ok == 0 || size == 0 {
                return None;
            }

            let path_str = String::from_utf16_lossy(&buf[..size as usize]);
            let p = PathBuf::from(path_str);
            if p.exists() { Some(p) } else { None }
        }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn is_process_running(name: &str) -> bool {
    std::process::Command::new("pgrep")
        .args(["-x", name])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn codex_process_name() -> &'static str {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        "Codex"
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        "codex"
    }
}

pub fn is_codex_app_running() -> bool {
    is_process_running(codex_process_name())
}

pub fn stop_codex_app_gracefully(timeout: Duration) -> Result<(), CoreError> {
    if !is_codex_app_running() {
        return Ok(());
    }

    // 优雅退出：忽略信号发送本身的错误（部分 Windows 版本/权限下即使成功
    // 发出信号也可能返回非零码），只用进程是否消失来判断结果。
    let _ = request_codex_app_quit();
    if wait_for_process_exit(codex_process_name(), timeout) {
        return Ok(());
    }

    // 优雅退出超时（Windows 上可能弹对话框或任务未完成）；
    // 降级到强制 kill，再等一小段时间，避免直接报错卡死切换流程。
    let _ = kill_process(codex_process_name());
    if wait_for_process_exit(codex_process_name(), Duration::from_secs(5)) {
        return Ok(());
    }

    Err(CoreError::OperationFailed(
        "CODEX_APP_QUIT_TIMEOUT: Codex did not quit in time; please quit Codex manually and try again".to_string(),
    ))
}

pub fn ensure_no_codex_writer_processes() -> Result<(), CoreError> {
    // Windows 上强制 kill Codex.exe 后，Electron 的 Helper / GPU / Renderer
    // 子进程需要几百毫秒才能完全退出；立即检查会误判"仍在运行"。
    // 这里最多重试 3 次（每次间隔 500ms），覆盖绝大多数情况。
    #[cfg(target_os = "windows")]
    {
        for attempt in 0..3u32 {
            let writers = list_codex_writer_processes()?;
            if writers.is_empty() {
                return Ok(());
            }
            if attempt < 2 {
                std::thread::sleep(Duration::from_millis(500));
            } else {
                return Err(CoreError::OperationFailed(format!(
                    "CODEX_WRITER_RUNNING: 检测到仍有 Codex 相关进程可能正在写入线程数据。请完全退出 Codex 和 codex CLI 后再试：{}",
                    writers.join(" | ")
                )));
            }
        }
        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        let writers = list_codex_writer_processes()?;
        if writers.is_empty() {
            return Ok(());
        }
        Err(CoreError::OperationFailed(format!(
            "CODEX_WRITER_RUNNING: 检测到仍有 Codex 相关进程可能正在写入线程数据。请完全退出 Codex 和 codex CLI 后再试：{}",
            writers.join(" | ")
        )))
    }
}

#[cfg(target_os = "macos")]
fn list_codex_writer_processes() -> Result<Vec<String>, CoreError> {
    let output = std::process::Command::new("ps")
        .args(["-ax", "-o", "pid=,command="])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("ps failed: {e}")))?;
    if !output.status.success() {
        return Err(CoreError::OperationFailed(format!(
            "ps failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        )));
    }

    let current_pid = std::process::id();
    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim_start();
            let (pid, command) = trimmed.split_once(char::is_whitespace)?;
            let pid = pid.parse::<u32>().ok()?;
            let command = command.trim_start();
            if pid == current_pid || !is_codex_writer_command(command) {
                return None;
            }
            Some(format!("{pid} {command}"))
        })
        .collect())
}

#[cfg(target_os = "macos")]
fn is_codex_writer_command(command: &str) -> bool {
    if command.contains("/.cursor/extensions/") || command.contains("/Cursor.app/") {
        return false;
    }
    // crashpad_handler 是 Electron 的崩溃报告子进程，主进程退出后可能残留数秒，
    // 不应被视为"Codex 仍在运行"。
    if command.contains("crashpad_handler") {
        return false;
    }
    command.contains("Codex.app/")
        || command.contains("Codex Helper")
        || command == "codex"
        || command.starts_with("codex ")
        || command.ends_with("/codex")
        || command.contains("/codex ")
}

#[cfg(target_os = "windows")]
fn list_codex_writer_processes() -> Result<Vec<String>, CoreError> {
    use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
    };

    let current_pid = std::process::id();
    let mut result = Vec::new();

    unsafe {
        let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snapshot == INVALID_HANDLE_VALUE {
            return Ok(result);
        }

        let mut entry: PROCESSENTRY32W = std::mem::zeroed();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;

        if Process32FirstW(snapshot, &mut entry) == 0 {
            CloseHandle(snapshot);
            return Ok(result);
        }

        loop {
            let exe_name: String = entry
                .szExeFile
                .iter()
                .take_while(|&&c| c != 0)
                .map(|&c| c as u8 as char)
                .collect();
            let exe_lower = exe_name.to_ascii_lowercase();

            if entry.th32ProcessID != current_pid
                && (exe_lower == "codex.exe" || exe_lower.starts_with("codex "))
            {
                result.push(format!("{} {}", entry.th32ProcessID, exe_name));
            }

            if Process32NextW(snapshot, &mut entry) == 0 {
                break;
            }
        }

        CloseHandle(snapshot);
    }
    Ok(result)
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn list_codex_writer_processes() -> Result<Vec<String>, CoreError> {
    let output = std::process::Command::new("pgrep")
        .args(["-af", "codex"])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("pgrep failed: {e}")))?;
    if !output.status.success() {
        return Ok(Vec::new());
    }
    let current_pid = std::process::id().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout
        .lines()
        .filter(|line| !line.starts_with(&current_pid))
        .map(|line| line.trim().to_string())
        .collect())
}

#[cfg(target_os = "macos")]
fn request_codex_app_quit() -> Result<(), CoreError> {
    let output = std::process::Command::new("osascript")
        .args(["-e", r#"tell application "Codex" to quit"#])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("osascript quit Codex failed: {e}")))?;
    if !output.status.success() {
        return Err(CoreError::OperationFailed(format!(
            "osascript quit Codex failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        )));
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn request_codex_app_quit() -> Result<(), CoreError> {
    let output = crate::platform::windows::background_command("taskkill")
        .args(["/IM", "Codex.exe"])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("taskkill Codex failed: {e}")))?;
    if !output.status.success() {
        return Err(CoreError::OperationFailed(format!(
            "taskkill Codex failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        )));
    }
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn request_codex_app_quit() -> Result<(), CoreError> {
    let output = std::process::Command::new("pkill")
        .args(["-TERM", "codex"])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("pkill Codex failed: {e}")))?;
    if !output.status.success() {
        return Err(CoreError::OperationFailed(format!(
            "pkill Codex failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        )));
    }
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn open_terminal_with_command(command: &str) -> Result<(), CoreError> {
    let script = format!(
        r#"tell application "Terminal"
    activate
    do script "{}"
end tell"#,
        command.replace('\\', "\\\\").replace('"', "\\\"")
    );
    std::process::Command::new("osascript")
        .args(["-e", &script])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("osascript failed: {e}")))?;
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn open_terminal_with_command(command: &str) -> Result<(), CoreError> {
    std::process::Command::new("cmd")
        .args(["/c", "start", "cmd", "/k", command])
        .output()
        .map_err(|e| CoreError::OperationFailed(format!("cmd start failed: {e}")))?;
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn open_terminal_with_command(command: &str) -> Result<(), CoreError> {
    for terminal in &["gnome-terminal", "xterm", "konsole"] {
        if std::process::Command::new("which")
            .arg(terminal)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            let _ = std::process::Command::new(terminal)
                .args(["--", "sh", "-c", command])
                .spawn();
            return Ok(());
        }
    }
    Err(CoreError::OperationFailed(
        "No terminal emulator found".to_string(),
    ))
}

#[cfg(target_os = "macos")]
pub fn launch_codex_app() -> Result<(), CoreError> {
    let launch_timeout = Duration::from_secs(3);

    let bundle_ids = ["com.openai.codex", "com.openai.Codex"];
    for _ in 0..2 {
        for bid in &bundle_ids {
            let result = std::process::Command::new("open")
                .args(["-b", bid])
                .output();
            if let Ok(o) = result {
                if o.status.success() && wait_for_process_start("Codex", launch_timeout) {
                    return Ok(());
                }
            }
        }

        let app_paths = [
            "/Applications/Codex.app",
            &format!(
                "{}/Applications/Codex.app",
                dirs::home_dir().unwrap_or_default().display()
            ),
        ];
        for path in &app_paths {
            if std::path::Path::new(path).exists() {
                std::process::Command::new("open")
                    .arg(path)
                    .output()
                    .map_err(|e| CoreError::OperationFailed(format!("open app failed: {e}")))?;
                if wait_for_process_start("Codex", launch_timeout) {
                    return Ok(());
                }
            }
        }

        std::thread::sleep(Duration::from_millis(250));
    }

    Err(CoreError::OperationFailed(
        "Codex launch timed out".to_string(),
    ))
}

#[cfg(target_os = "macos")]
pub fn restart_codex_app() -> Result<(), CoreError> {
    stop_codex_app_gracefully(Duration::from_secs(8))?;
    launch_codex_app()
}

#[cfg(target_os = "windows")]
pub fn launch_codex_app() -> Result<(), CoreError> {
    launch_windows_codex_app()
}

#[cfg(target_os = "windows")]
pub fn restart_codex_app() -> Result<(), CoreError> {
    snapshot_running_codex_path();
    stop_codex_app_gracefully(Duration::from_secs(8))?;
    launch_windows_codex_app()
}

#[cfg(target_os = "windows")]
pub(crate) fn stop_windows_codex_app() -> Result<(), CoreError> {
    snapshot_running_codex_path();
    stop_codex_app_gracefully(Duration::from_secs(8))
}

#[cfg(target_os = "windows")]
pub fn snapshot_codex_path_before_stop() {
    snapshot_running_codex_path();
}

/// Windows 路由 toggle / config 重写前的快路径：
/// - Codex 未运行时直接返回，避免 PowerShell snapshot + writer probe 的开销
///   （AiMaMi 用户经常在打开 Codex 之前就先在面板里切换路由）
/// - Codex 在跑时按完整流程：snapshot 路径 + graceful stop +
///   ensure 写 ~/.codex 的进程都退出
///
/// 调用方（manager.rs::set_codex_router_enabled）已经把
/// snapshot_codex_path_before_stop 与 stop_codex_app_gracefully +
/// ensure_no_codex_writer_processes 三步在 Windows 上合并到这一个入口，
/// 避免每次 toggle 都付几百 ms 启动开销。
#[cfg(target_os = "windows")]
pub fn stop_codex_for_config_edit(timeout: Duration) -> Result<(), CoreError> {
    if !is_codex_app_running() {
        return Ok(());
    }
    snapshot_running_codex_path();
    // Codex is running (checked above); skip the redundant is_codex_app_running()
    // inside stop_codex_app_gracefully by inlining the stop logic directly.
    let _ = request_codex_app_quit();
    if !wait_for_process_exit(codex_process_name(), timeout) {
        let _ = kill_process(codex_process_name());
        if !wait_for_process_exit(codex_process_name(), Duration::from_secs(5)) {
            return Err(CoreError::OperationFailed(
                "CODEX_APP_QUIT_TIMEOUT: Codex did not quit in time; please quit Codex manually and try again".to_string(),
            ));
        }
    }
    ensure_no_codex_writer_processes()
}

#[cfg(target_os = "windows")]
fn snapshot_running_codex_path() {
    let path = get_running_process_path("Codex");
    if let Some(ref p) = path {
        log::info!("[AiMaMi] captured running Codex path: {}", p.display());
    }
    if let Ok(mut cached) = LAST_KNOWN_CODEX_PATH.lock() {
        *cached = path;
    }
}

#[cfg(target_os = "windows")]
fn get_running_process_path(name: &str) -> Option<PathBuf> {
    win32_process::get_process_exe_path(name)
}

#[cfg(target_os = "windows")]
pub(crate) fn launch_windows_codex_app() -> Result<(), CoreError> {
    let cached = LAST_KNOWN_CODEX_PATH
        .lock()
        .ok()
        .and_then(|guard| guard.clone())
        .filter(|p| p.exists());
    let path = cached
        .or_else(find_windows_codex_exe)
        .ok_or_else(|| CoreError::NotFound("Codex.exe not found".to_string()))?;
    launch_windows_codex_from_path(&path)
}

#[cfg(target_os = "windows")]
fn launch_windows_codex_from_path(path: &Path) -> Result<(), CoreError> {
    let launch_timeout = Duration::from_secs(5);

    let mut direct = crate::platform::windows::background_command_path(path);
    if let Some(parent) = path.parent() {
        direct.current_dir(parent);
    }
    if direct.spawn().is_ok() && wait_for_process_start("Codex", launch_timeout) {
        return Ok(());
    }

    let path_literal = windows_powershell_literal(path.to_string_lossy().as_ref());
    crate::platform::windows::background_command("powershell")
        .args([
            "-NoProfile",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &format!("Start-Process -FilePath '{path_literal}'"),
        ])
        .spawn()
        .map_err(|e| CoreError::OperationFailed(format!("launch failed: {e}")))?;

    if wait_for_process_start("Codex", launch_timeout) {
        return Ok(());
    }

    Err(CoreError::OperationFailed(format!(
        "Codex did not start after launch: {}",
        path.display()
    )))
}

#[cfg(target_os = "windows")]
fn find_windows_codex_exe() -> Option<PathBuf> {
    for candidate in windows_codex_candidates() {
        if candidate.exists() {
            return Some(candidate);
        }
    }

    if let Some(p) = find_codex_from_registry() {
        return Some(p);
    }

    crate::platform::windows::background_command("where")
        .arg("Codex.exe")
        .output()
        .ok()
        .filter(|output| output.status.success())
        .and_then(|output| {
            String::from_utf8(output.stdout).ok().and_then(|stdout| {
                stdout
                    .lines()
                    .map(str::trim)
                    .find(|line| !line.is_empty())
                    .map(PathBuf::from)
                    .filter(|path| path.exists())
            })
        })
        .or_else(|| {
            crate::platform::windows::background_command("where")
                .arg("Codex")
                .output()
                .ok()
                .filter(|output| output.status.success())
                .and_then(|output| {
                    String::from_utf8(output.stdout).ok().and_then(|stdout| {
                        stdout
                            .lines()
                            .map(str::trim)
                            .find(|line| !line.is_empty())
                            .map(PathBuf::from)
                            .filter(|path| path.exists())
                    })
                })
        })
}

#[cfg(target_os = "windows")]
fn windows_codex_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    let env_candidates = [
        ("LOCALAPPDATA", "Programs\\Codex\\Codex.exe"),
        ("LOCALAPPDATA", "Codex\\Codex.exe"),
        ("LOCALAPPDATA", "Programs\\OpenAI Codex\\Codex.exe"),
        ("LOCALAPPDATA", "Programs\\OpenAI\\Codex\\Codex.exe"),
        ("PROGRAMFILES", "Codex\\Codex.exe"),
        ("PROGRAMFILES", "OpenAI Codex\\Codex.exe"),
        ("PROGRAMFILES", "OpenAI\\Codex\\Codex.exe"),
        ("PROGRAMFILES(X86)", "Codex\\Codex.exe"),
        ("PROGRAMFILES(X86)", "OpenAI Codex\\Codex.exe"),
        ("PROGRAMFILES(X86)", "OpenAI\\Codex\\Codex.exe"),
    ];

    for (env_key, suffix) in env_candidates {
        if let Ok(prefix) = std::env::var(env_key) {
            if !prefix.trim().is_empty() {
                candidates.push(PathBuf::from(prefix).join(suffix));
            }
        }
    }

    candidates
}

#[cfg(target_os = "windows")]
fn find_codex_from_registry() -> Option<PathBuf> {
    let reg_paths = [
        r"HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Codex.exe",
        r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Codex.exe",
    ];
    for reg_path in reg_paths {
        if let Some(p) = query_reg_default_value(reg_path) {
            let pb = PathBuf::from(&p);
            if pb.exists() {
                return Some(pb);
            }
        }
    }

    let uninstall_roots = [
        r"HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    ];
    for root in uninstall_roots {
        if let Some(p) = find_codex_in_uninstall_entries(root) {
            return Some(p);
        }
    }
    None
}

#[cfg(target_os = "windows")]
fn query_reg_default_value(key_path: &str) -> Option<String> {
    let output = crate::platform::windows::background_command("reg")
        .args(["query", key_path, "/ve"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        let trimmed = line.trim();
        if trimmed.contains("REG_SZ") || trimmed.contains("REG_EXPAND_SZ") {
            let parts: Vec<&str> = trimmed.splitn(3, "    ").collect();
            if parts.len() == 3 {
                let value = parts[2].trim();
                if !value.is_empty() {
                    return Some(value.to_string());
                }
            }
        }
    }
    None
}

#[cfg(target_os = "windows")]
fn find_codex_in_uninstall_entries(root: &str) -> Option<PathBuf> {
    let output = crate::platform::windows::background_command("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!(
                "Get-ChildItem 'Registry::{}' -ErrorAction SilentlyContinue | ForEach-Object {{ \
                    $dn = (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).DisplayName; \
                    $il = (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).InstallLocation; \
                    if ($dn -like '*Codex*' -and $il) {{ Write-Output $il }} \
                }}",
                root
            ),
        ])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        let dir = line.trim();
        if dir.is_empty() {
            continue;
        }
        let exe = PathBuf::from(dir).join("Codex.exe");
        if exe.exists() {
            return Some(exe);
        }
    }
    None
}

#[cfg(target_os = "windows")]
fn windows_powershell_literal(value: &str) -> String {
    value.replace('\'', "''")
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn launch_codex_app() -> Result<(), CoreError> {
    std::process::Command::new("codex")
        .spawn()
        .map_err(|e| CoreError::OperationFailed(format!("launch failed: {e}")))?;
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn restart_codex_app() -> Result<(), CoreError> {
    stop_codex_app_gracefully(Duration::from_secs(8))?;
    launch_codex_app()
}
