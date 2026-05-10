use crate::core::repository::Repository;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};

const HOTSPOT_LABEL: &str = "hotspot";

#[tauri::command]
pub fn has_notch(app: AppHandle) -> Result<bool, String> {
    use std::sync::mpsc;
    let (tx, rx) = mpsc::channel();
    app.run_on_main_thread(move || {
        tx.send(crate::platform::screen::has_notch_screen()).ok();
    })
    .map_err(|e| e.to_string())?;
    rx.recv().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_hotspot_enabled(repo: State<'_, Mutex<Repository>>) -> Result<bool, String> {
    let repo = repo.lock().map_err(|e| e.to_string())?;
    Ok(repo.get_hotspot_enabled())
}

pub fn register_hotspot_relayout_observers(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    {
        use std::sync::OnceLock;
        static INSTALLED: OnceLock<()> = OnceLock::new();
        if INSTALLED.set(()).is_err() {
            return;
        }

        let handle = app.clone();
        let _ = app.run_on_main_thread(move || {
            install_native_hotspot_observers(handle);
        });
    }
}

#[tauri::command]
pub fn set_hotspot_enabled(
    app: AppHandle,
    repo: State<'_, Mutex<Repository>>,
    enabled: bool,
) -> Result<bool, String> {
    {
        let repo = repo.lock().map_err(|e| e.to_string())?;
        repo.set_hotspot_enabled(enabled)
            .map_err(|e| e.to_string())?;
    }
    if enabled {
        create_hotspot_window(&app).map_err(|e| e.to_string())?;
    } else {
        destroy_hotspot_window(&app);
    }
    Ok(enabled)
}

#[tauri::command]
pub fn focus_main_window(app: AppHandle) -> Result<(), String> {
    // 来自前端的"聚焦主窗口"命令默认走强制前台路径，
    // 避免主窗口被 Codex / iTerm / Cursor 等始终在前的应用挡住。
    force_reveal_main_window(&app);
    Ok(())
}

/// 普通"显示主窗口"路径：保留当前 always_on_top 状态，仅做 show + unminimize + set_focus。
/// 用于第一次启动 / 后续 Tauri 自动唤起场景。
pub fn reveal_main_window(app: &AppHandle) {
    reveal_main_window_inner(app, false);
}

/// 强制把主窗口拉到所有窗口最前面：用 always_on_top 短脉冲（180ms）+
/// macOS NSApplication.activateIgnoringOtherApps 把焦点夺回。
///
/// 用于：
/// - 用户从 Dock / 任务栏点击 AiMaMi 已打开的实例（macOS Reopen / Windows
///   single-instance activation watcher），保证窗口一定能浮到最前
/// - 其他始终在前的应用（Codex / 开发工具）开启时，让 AiMaMi 不被遮挡
pub fn force_reveal_main_window(app: &AppHandle) {
    reveal_main_window_inner(app, true);
}

fn reveal_main_window_inner(app: &AppHandle, force_front: bool) {
    let handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        if let Some(win) = handle.get_webview_window("main") {
            if force_front {
                let was_always_on_top = win.is_always_on_top().unwrap_or(false);
                bring_main_window_force_forward(&win);

                let handle = handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(180));
                    let window_handle = handle.clone();
                    let _ = handle.run_on_main_thread(move || {
                        if let Some(win) = window_handle.get_webview_window("main") {
                            bring_main_window_force_forward(&win);
                            if !was_always_on_top {
                                let _ = win.set_always_on_top(false);
                            }
                        }
                    });
                });
            } else {
                bring_main_window_forward(&win);
            }
        }
        // Defer dock policy switch so the window appears instantly
        // without waiting for the system-level activation policy transition
        #[cfg(target_os = "macos")]
        {
            let h2 = handle.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(50));
                let _ = h2.run_on_main_thread(move || {
                    crate::platform::dock::set_dock_visible(true);
                });
            });
        }
    });
}

fn bring_main_window_forward(win: &tauri::WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        set_window_alpha(win, 1.0);
        crate::platform::dock::set_dock_visible(true);
        activate_macos_app();
    }
    let _ = win.show();
    let _ = win.unminimize();
    let _ = win.set_focusable(true);
    let _ = win.set_focus();
}

fn bring_main_window_force_forward(win: &tauri::WebviewWindow) {
    bring_main_window_forward(win);
    // 短暂 always-on-top 脉冲：让 Windows 二次启动激活和 macOS 隐藏 / 最小化
    // 状态恢复都能压到所有窗口之上。调用方在 180ms 后会恢复原始 topmost 状态。
    let _ = win.set_always_on_top(true);
    let _ = win.set_focus();
}

#[cfg(target_os = "macos")]
#[allow(deprecated)]
fn activate_macos_app() {
    use objc2_app_kit::{NSApplication, NSRunningApplication};
    use objc2_foundation::MainThreadMarker;

    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    let app = NSApplication::sharedApplication(mtm);
    app.activateIgnoringOtherApps(true);
    let running = NSRunningApplication::currentApplication();
    let _ = running.activateWithOptions(
        objc2_app_kit::NSApplicationActivationOptions::ActivateAllWindows
            | objc2_app_kit::NSApplicationActivationOptions::ActivateIgnoringOtherApps,
    );
}

#[tauri::command]
pub fn hotspot_ready(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(HOTSPOT_LABEL) {
        apply_hotspot_layout(&win, true);
        #[cfg(target_os = "macos")]
        {
            set_hotspot_alpha(&win, 1.0);
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = win.show();
        }
    }
    Ok(())
}

pub fn create_hotspot_window(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    if app.get_webview_window(HOTSPOT_LABEL).is_some() {
        return Ok(());
    }

    let win = WebviewWindowBuilder::new(app, HOTSPOT_LABEL, WebviewUrl::App("index.html".into()))
        .title("")
        .inner_size(380.0, 38.0)
        .position(0.0, 0.0)
        .decorations(false)
        .transparent(true)
        .resizable(false)
        .skip_taskbar(true)
        .visible(false)
        .build()?;

    #[cfg(target_os = "macos")]
    {
        use objc2_foundation::MainThreadMarker;
        if MainThreadMarker::new().is_some() {
            apply_native_hotspot_properties(&win, false);
            set_hotspot_alpha(&win, 0.0);
            let _ = win.show();
        } else {
            let handle = app.clone();
            app.run_on_main_thread(move || {
                if let Some(w) = handle.get_webview_window(HOTSPOT_LABEL) {
                    apply_native_hotspot_properties(&w, false);
                    set_hotspot_alpha(&w, 0.0);
                    let _ = w.show();
                }
            })?;
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = win.show();
    }

    Ok(())
}

fn destroy_hotspot_window(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(HOTSPOT_LABEL) {
        let _ = win.close();
    }
}

fn apply_hotspot_layout(win: &tauri::WebviewWindow, bring_to_front: bool) {
    #[cfg(target_os = "macos")]
    {
        apply_native_hotspot_properties(win, bring_to_front);
    }
}

fn schedule_hotspot_relayout(app: AppHandle) {
    static RELAYOUT_VERSION: AtomicU64 = AtomicU64::new(0);
    let version = RELAYOUT_VERSION.fetch_add(1, Ordering::SeqCst) + 1;

    for delay_ms in [0_u64, 300_u64, 1200_u64] {
        let handle = app.clone();
        std::thread::spawn(move || {
            if delay_ms > 0 {
                std::thread::sleep(std::time::Duration::from_millis(delay_ms));
            }
            if RELAYOUT_VERSION.load(Ordering::SeqCst) == version {
                refresh_hotspot_on_main(&handle);
            }
        });
    }
}

fn refresh_hotspot_on_main(app: &AppHandle) {
    let handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        if let Some(win) = handle.get_webview_window(HOTSPOT_LABEL) {
            apply_hotspot_layout(&win, true);
        }
    });
}

#[cfg(target_os = "macos")]
fn apply_native_hotspot_properties(win: &tauri::WebviewWindow, bring_to_front: bool) {
    use crate::platform::screen::compute_hotspot_frame;
    use objc2::rc::Retained;
    use objc2_app_kit::{NSColor, NSWindow, NSWindowCollectionBehavior};
    use objc2_foundation::{NSPoint, NSRect, NSSize};

    let ns_window_ptr = match win.ns_window() {
        Ok(ptr) => ptr,
        Err(_) => return,
    };
    let Some(ns_window) = (unsafe { Retained::retain(ns_window_ptr as *mut NSWindow) }) else {
        return;
    };

    ns_window.setLevel(25); // NSStatusWindowLevel
    ns_window.setCollectionBehavior(
        NSWindowCollectionBehavior::CanJoinAllSpaces
            | NSWindowCollectionBehavior::Stationary
            | NSWindowCollectionBehavior::IgnoresCycle,
    );
    ns_window.setHasShadow(false);
    ns_window.setOpaque(false);
    let clear = NSColor::clearColor();
    ns_window.setBackgroundColor(Some(&clear));

    if let Some(hotspot) = compute_hotspot_frame() {
        let frame = NSRect {
            origin: NSPoint {
                x: hotspot.x,
                y: hotspot.y,
            },
            size: NSSize {
                width: hotspot.width,
                height: hotspot.height,
            },
        };
        ns_window.setFrame_display(frame, true);
    }

    if bring_to_front && ns_window.isVisible() {
        ns_window.orderFrontRegardless();
    }
}

#[cfg(target_os = "macos")]
fn set_hotspot_alpha(win: &tauri::WebviewWindow, alpha: f64) {
    set_window_alpha(win, alpha);
}

#[cfg(target_os = "macos")]
fn set_window_alpha(win: &tauri::WebviewWindow, alpha: f64) {
    use objc2::rc::Retained;
    use objc2_app_kit::NSWindow;

    let ns_window_ptr = match win.ns_window() {
        Ok(ptr) => ptr,
        Err(_) => return,
    };
    let Some(ns_window) = (unsafe { Retained::retain(ns_window_ptr as *mut NSWindow) }) else {
        return;
    };

    ns_window.setAlphaValue(alpha);
}

#[cfg(target_os = "macos")]
fn install_native_hotspot_observers(app: AppHandle) {
    use block2::RcBlock;
    use objc2::runtime::AnyObject;
    use objc2_app_kit::{
        NSApplicationDidChangeScreenParametersNotification, NSWorkspace,
        NSWorkspaceActiveSpaceDidChangeNotification, NSWorkspaceDidWakeNotification,
        NSWorkspaceScreensDidWakeNotification, NSWorkspaceSessionDidBecomeActiveNotification,
    };
    use objc2_foundation::{NSNotification, NSNotificationCenter};

    let app_center = NSNotificationCenter::defaultCenter();
    let workspace_center = NSWorkspace::sharedWorkspace().notificationCenter();

    let register = |center: &objc2_foundation::NSNotificationCenter,
                    name: &'static objc2_foundation::NSNotificationName,
                    app: &AppHandle| {
        let handle = app.clone();
        let block = RcBlock::new(move |_notification: std::ptr::NonNull<NSNotification>| {
            schedule_hotspot_relayout(handle.clone());
        });
        let observer = unsafe {
            center.addObserverForName_object_queue_usingBlock(
                Some(name),
                None::<&AnyObject>,
                None,
                &block,
            )
        };
        let _ = Box::leak(Box::new(observer));
    };

    unsafe {
        register(
            &app_center,
            NSApplicationDidChangeScreenParametersNotification,
            &app,
        );
        register(&workspace_center, NSWorkspaceDidWakeNotification, &app);
        register(
            &workspace_center,
            NSWorkspaceScreensDidWakeNotification,
            &app,
        );
        register(
            &workspace_center,
            NSWorkspaceSessionDidBecomeActiveNotification,
            &app,
        );
        register(
            &workspace_center,
            NSWorkspaceActiveSpaceDidChangeNotification,
            &app,
        );
    }
}
