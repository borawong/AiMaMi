//! Cross-platform process-level single instance guard.
//!
//! This guard is intentionally acquired before Tauri setup starts so a second
//! AiMaMi process cannot rewrite Codex config.

use crate::platform::paths::CodexPaths;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

pub struct ActivationWatcherGuard {
    shutdown: Arc<AtomicBool>,
}

impl Drop for ActivationWatcherGuard {
    fn drop(&mut self) {
        self.shutdown.store(true, Ordering::Relaxed);
    }
}

#[cfg(windows)]
mod imp {
    use std::ffi::c_void;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr;

    const ERROR_ALREADY_EXISTS: u32 = 183;

    type Handle = *mut c_void;

    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn CreateMutexW(
            lp_mutex_attributes: *mut c_void,
            b_initial_owner: i32,
            lp_name: *const u16,
        ) -> Handle;
        fn GetLastError() -> u32;
        fn CloseHandle(h_object: Handle) -> i32;
    }

    pub struct SingleInstanceGuard {
        handle: Handle,
    }

    impl Drop for SingleInstanceGuard {
        fn drop(&mut self) {
            if !self.handle.is_null() {
                unsafe {
                    let _ = CloseHandle(self.handle);
                }
            }
        }
    }

    pub fn acquire() -> Result<SingleInstanceGuard, String> {
        // Local\\ is per interactive user session and avoids the extra
        // privilege requirements that Global\\ can trigger on locked-down
        // Windows machines.
        let name: Vec<u16> = std::ffi::OsStr::new("Local\\dev.aimami.desktop.single-instance")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        let handle = unsafe { CreateMutexW(ptr::null_mut(), 1, name.as_ptr()) };
        if handle.is_null() {
            return Err(format!("create single-instance mutex failed: {}", unsafe {
                GetLastError()
            }));
        }
        let last_error = unsafe { GetLastError() };
        if last_error == ERROR_ALREADY_EXISTS {
            unsafe {
                let _ = CloseHandle(handle);
            }
            return Err("AiMaMi is already running".into());
        }
        Ok(SingleInstanceGuard { handle })
    }
}

#[cfg(unix)]
mod imp {
    use std::fs::{File, OpenOptions};
    use std::io::Write;
    use std::os::fd::AsRawFd;

    const LOCK_EX: i32 = 2;
    const LOCK_NB: i32 = 4;

    unsafe extern "C" {
        fn flock(fd: i32, operation: i32) -> i32;
    }

    pub struct SingleInstanceGuard {
        _file: File,
    }

    pub fn acquire() -> Result<SingleInstanceGuard, String> {
        let dir = dirs::data_local_dir()
            .unwrap_or_else(std::env::temp_dir)
            .join("dev.aimami.desktop");
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("prepare single-instance lock dir failed: {e}"))?;
        let path = dir.join("aimami-single-instance.lock");
        let mut file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(&path)
            .map_err(|e| format!("open single-instance lock failed ({}): {e}", path.display()))?;
        let rc = unsafe { flock(file.as_raw_fd(), LOCK_EX | LOCK_NB) };
        if rc != 0 {
            return Err("AiMaMi is already running".into());
        }
        let _ = file.set_len(0);
        let _ = writeln!(file, "pid={}", std::process::id());
        Ok(SingleInstanceGuard { _file: file })
    }
}

#[cfg(windows)]
pub use imp::SingleInstanceGuard;

#[cfg(unix)]
pub use imp::SingleInstanceGuard;

#[cfg(windows)]
pub fn acquire(_paths: &CodexPaths) -> Result<SingleInstanceGuard, String> {
    imp::acquire()
}

#[cfg(unix)]
pub fn acquire(_paths: &CodexPaths) -> Result<SingleInstanceGuard, String> {
    imp::acquire()
}

pub fn start_activation_watcher<F>(on_activate: F) -> Result<ActivationWatcherGuard, String>
where
    F: Fn() + Send + 'static,
{
    let request_path = activation_request_path();
    prepare_activation_dir(&request_path)?;
    let shutdown = Arc::new(AtomicBool::new(false));
    let thread_shutdown = Arc::clone(&shutdown);
    std::thread::spawn(move || {
        let mut last_seen: Option<String> = None;
        while !thread_shutdown.load(Ordering::Relaxed) {
            if let Ok(current) = std::fs::read_to_string(&request_path) {
                if !current.trim().is_empty() && last_seen.as_deref() != Some(current.as_str()) {
                    last_seen = Some(current);
                    on_activate();
                }
            }
            std::thread::sleep(Duration::from_millis(120));
        }
    });

    Ok(ActivationWatcherGuard { shutdown })
}

pub fn request_existing_instance_activation() -> bool {
    write_activation_request(&activation_request_path()).is_ok()
}

fn activation_request_path() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(std::env::temp_dir)
        .join("dev.aimami.desktop")
        .join("aimami-activate.request")
}

fn prepare_activation_dir(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("prepare activation request dir failed: {e}"))?;
    }
    Ok(())
}

fn write_activation_request(path: &Path) -> Result<(), String> {
    prepare_activation_dir(path)?;
    let mut file = std::fs::File::create(path)
        .map_err(|e| format!("create activation request failed: {e}"))?;
    writeln!(file, "{}", Uuid::new_v4())
        .map_err(|e| format!("write activation request failed: {e}"))
}
