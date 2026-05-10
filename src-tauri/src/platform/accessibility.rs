//! macOS 辅助功能（Accessibility）权限查询 / 请求。
//!
//! AiMaMi 的核心能力之一是「识别完成后自动把文本粘贴到光标位置」，这条链路
//! 需要：
//! 1. 读写系统剪贴板（NSPasteboard，无额外权限）；
//! 2. 合成 Cmd+V 键盘事件（CGEvent），此步骤必须应用被用户加入
//!    「隐私与安全性 → 辅助功能」白名单，否则 `CGEventPost` 会静默失败。
//!
//! macOS 的 Accessibility 权限不像麦克风 / 语音识别那样有「.notDetermined」
//! 状态——从 API 层面只能拿到 `true` / `false`。本模块将其语义化为：
//! - `true` → `Authorized`
//! - `false` → `NotDetermined`（既可能是从未勾选，也可能是被用户关掉）。
//!
//! 申请授权有两条路：
//! - `query()` / `is_trusted()`：只读状态，不触发任何 UI；
//! - `prompt_trust()`：调用 `AXIsProcessTrustedWithOptions({ Prompt: true })`，
//!   让系统弹出标准授权对话框，并自动定位到「系统设置 → 隐私与安全性 →
//!   辅助功能」里当前 build 对应的条目。用户勾选后，调用方应重新查询状态。
//!
//! 只在 macOS 下编译，其他平台永远返回 `Unsupported`。

use crate::core::models::VoicePermissionState;

#[cfg(target_os = "macos")]
use std::ffi::c_void;

// --- CoreFoundation / ApplicationServices C 符号 ---------------------------
//
// 这里直接 extern static 拿 CFBoolean / CFString 常量，避免引入 core-foundation
// crate。AXIsProcessTrustedWithOptions 需要一个包含
// `kAXTrustedCheckOptionPrompt -> kCFBooleanTrue` 的 CFDictionary，我们手动
// CFDictionaryCreate + CFRelease，调用路径简洁且无泄漏。

#[cfg(target_os = "macos")]
type CFTypeRef = *const c_void;
#[cfg(target_os = "macos")]
type CFDictionaryRef = *const c_void;

#[cfg(target_os = "macos")]
#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    static kCFBooleanTrue: CFTypeRef;
    fn CFDictionaryCreate(
        allocator: CFTypeRef,
        keys: *const CFTypeRef,
        values: *const CFTypeRef,
        num_values: isize,
        key_callbacks: *const c_void,
        value_callbacks: *const c_void,
    ) -> CFDictionaryRef;
    fn CFRelease(cf: CFTypeRef);
}

#[cfg(target_os = "macos")]
#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    static kAXTrustedCheckOptionPrompt: CFTypeRef;
    fn AXIsProcessTrusted() -> bool;
    fn AXIsProcessTrustedWithOptions(options: CFDictionaryRef) -> bool;
}

/// 查询当前进程是否已被加入辅助功能白名单，不会弹任何提示框。
pub fn query() -> VoicePermissionState {
    #[cfg(target_os = "macos")]
    {
        if unsafe { AXIsProcessTrusted() } {
            VoicePermissionState::Authorized
        } else {
            VoicePermissionState::NotDetermined
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        VoicePermissionState::Unsupported
    }
}

/// 是否已获得辅助功能权限（等价于 `query() == Authorized`）。
pub fn is_trusted() -> bool {
    matches!(query(), VoicePermissionState::Authorized)
}

/// 弹出系统的"请求辅助功能权限"对话框，并自动定位到系统设置里当前 build 的条目。
///
/// 返回当前查询到的权限状态。用户在系统设置勾选后，调用方应在窗口重新获得焦点
/// 或用户点击"重新检查"时再次调用 `query()`。
pub fn prompt_trust() -> VoicePermissionState {
    #[cfg(target_os = "macos")]
    unsafe {
        let key = kAXTrustedCheckOptionPrompt;
        let value = kCFBooleanTrue;
        let keys: [CFTypeRef; 1] = [key];
        let values: [CFTypeRef; 1] = [value];
        // 传 null callbacks 对只存在于本函数栈的临时 dict 是安全的：keys/values
        // 都是 CoreFoundation 常量对象，没有 retain / release 生命周期问题。
        let dict = CFDictionaryCreate(
            std::ptr::null(),
            keys.as_ptr(),
            values.as_ptr(),
            1,
            std::ptr::null(),
            std::ptr::null(),
        );
        let trusted = AXIsProcessTrustedWithOptions(dict);
        if !dict.is_null() {
            CFRelease(dict);
        }
        if trusted {
            VoicePermissionState::Authorized
        } else {
            VoicePermissionState::NotDetermined
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        VoicePermissionState::Unsupported
    }
}
