//! 解析当前 GUI 进程对应的 `.app` bundle 路径与身份。
//!
//! TCC（麦克风 / 语音识别 / 辅助功能）与 LaunchServices 登记的 bundle 强相关。
//! `std::env::current_exe()` 在少数启动方式下可能与 `NSBundle.mainBundle` 不一致；
//! **重启**、**诊断日志**都应优先以 `NSBundle` 为准。

use std::path::{Path, PathBuf};

/// 优先 `NSBundle.mainBundle.bundlePath`，否则沿 `current_exe` 向上查找以 `.app` 结尾的祖先目录。
pub fn resolve_app_bundle_path() -> Option<PathBuf> {
    main_bundle_path_via_ns().or_else(bundle_from_current_exe)
}

fn main_bundle_path_via_ns() -> Option<PathBuf> {
    use objc2_foundation::NSBundle;

    let bundle = NSBundle::mainBundle();
    let path = bundle.bundlePath();
    let s = path.to_string();
    if s.is_empty() {
        return None;
    }
    let pb = PathBuf::from(s);
    is_app_bundle(&pb).then_some(pb)
}

fn bundle_from_current_exe() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let mut cur = Some(exe.as_path());
    while let Some(p) = cur {
        if is_app_bundle(p) {
            return Some(p.to_path_buf());
        }
        cur = p.parent();
    }
    None
}

fn is_app_bundle(p: &Path) -> bool {
    p.extension().and_then(|x| x.to_str()) == Some("app")
}

/// 启动时打印 `NSBundle` 身份，便于对照系统设置里的 TCC 记录。
pub fn log_main_bundle_identity() {
    use objc2_foundation::NSBundle;

    let bundle = NSBundle::mainBundle();
    let path = bundle.bundlePath().to_string();
    let bid = bundle
        .bundleIdentifier()
        .map(|s| s.to_string())
        .unwrap_or_else(|| "<nil>".into());
    eprintln!("[AiMaMi] NSBundle.mainBundle: path={path} CFBundleIdentifier={bid}");
}
