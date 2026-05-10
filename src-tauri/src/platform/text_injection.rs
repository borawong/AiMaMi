//! macOS 文本注入：把识别到的文本「粘贴」到当前前台应用的光标位置。
//!
//! 原理对齐 Type4Me 的 `Injection/` 模块：
//! 1. 把当前 `NSPasteboard.generalPasteboard` 的纯文本备份下来；
//! 2. 写入本次要注入的文本；
//! 3. 通过 `CGEventPost` 合成 `Cmd+V` 组合键，模拟用户粘贴；
//! 4. 稍等一会儿（默认 120 ms），让前台应用完成粘贴动作；
//! 5. 恢复原剪贴板内容，做到「用后即焚」，不污染用户的剪贴板历史。
//!
//! 失败条件：
//! - 当前进程未获得「隐私与安全性 → 辅助功能」权限 → `CGEventPost` 静默失败，
//!   调用方应先通过 `accessibility::is_trusted()` 预检并引导用户授权；
//! - 系统处在锁屏 / Fast User Switching 过程中 → 无法合成 HID 事件；
//! - 前台应用不支持 `paste:` action（极少数 Electron 老版本），那得应用方自己处理。
//!
//! 仅限 macOS；其他平台模块体为空壳，直接返回错误。

use std::ffi::c_void;
use std::thread::sleep;
use std::time::Duration;

#[cfg(target_os = "macos")]
use objc2::ffi::NSInteger;
#[cfg(target_os = "macos")]
use objc2::runtime::{AnyClass, AnyObject};
#[cfg(target_os = "macos")]
use objc2::{class, msg_send};
#[cfg(target_os = "macos")]
use objc2_foundation::NSString;

use crate::platform::accessibility;

// --- CoreGraphics C 符号 -----------------------------------------------------
//
// 直接走弱链接而不引入 core-graphics crate，以免加重依赖树。所有 CGEvent /
// CGEventSource 相关符号都是 CoreGraphics framework 暴露的 C API。
#[cfg(target_os = "macos")]
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGEventSourceCreate(state_id: u32) -> *mut c_void;
    fn CGEventCreateKeyboardEvent(
        source: *mut c_void,
        virtual_key: u16,
        key_down: bool,
    ) -> *mut c_void;
    fn CGEventSetFlags(event: *mut c_void, flags: u64);
    fn CGEventPost(tap: u32, event: *mut c_void);
}

// CFRelease 的官方签名是 `void CFRelease(CFTypeRef)`，即 `*const c_void`；
// 这里延续该签名，调用点把 CGEvent 指针 cast 过去。accessibility.rs 也声明了
// 同一个符号，两个声明必须保持参数类型一致（否则 rustc 会报
// `clashing_extern_declarations`）。
#[cfg(target_os = "macos")]
#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFRelease(cf: *const c_void);
}

/// `kCGHIDEventTap` — 把事件注入到最高级别的 HID 事件流。
#[cfg(target_os = "macos")]
const K_CG_HID_EVENT_TAP: u32 = 0;
/// `kCGEventSourceStateHIDSystemState`
#[cfg(target_os = "macos")]
const K_CG_EVENT_SOURCE_STATE_HID_SYSTEM_STATE: u32 = 1;
/// `kCGEventFlagMaskCommand` — Cmd 修饰键的 flag mask。
#[cfg(target_os = "macos")]
const K_CG_EVENT_FLAG_MASK_COMMAND: u64 = 0x00100000;
/// macOS 键盘扫描码：V = 9（HIToolbox kVK_ANSI_V）。
#[cfg(target_os = "macos")]
const VIRTUAL_KEY_V: u16 = 9;

/// NSPasteboard.generalPasteboard 接收的纯文本 UTI。
#[cfg(target_os = "macos")]
const NS_PASTEBOARD_TYPE_STRING: &str = "public.utf8-plain-text";

/// 粘贴完成到恢复剪贴板之间的等待时间。
///
/// 取值经验：Type4Me 及其他类似工具一般在 80–200 ms 之间。太短会遇到某些应用
/// 还没来得及读剪贴板就被我们覆盖；太长会让用户感知到「粘完 → 剪贴板被清空」
/// 的延迟。120 ms 是比较稳妥的默认。
const RESTORE_DELAY: Duration = Duration::from_millis(120);

/// 把 `text` 注入到当前前台应用的光标位置。
///
/// # Errors
/// - 若无辅助功能权限，返回可读的中文错误，调用方应 toast 给用户并引导授权；
/// - 若 `text` 为空（去除首尾空白后），返回 `Err` 以便调用方决定是否静默忽略；
/// - 若 `expected_bundle_id` 提供且与当前前台应用不一致，返回错误，避免误粘到错误窗口。
///
/// # `expected_bundle_id`
/// 录音开始时调用 `capture_context()` 记录的 `target_bundle_id`。注入前会与当前前台应用比对，
/// 若不一致（用户在录音 / 处理过程中切走应用）则中止注入。传 `None` 表示不校验（如用户主动
/// 在历史记录里点"重新粘贴"，目标就是当前前台）。
pub fn inject_text(text: &str, expected_bundle_id: Option<&str>) -> Result<(), String> {
    if text.trim().is_empty() {
        return Err("文本为空，已跳过注入".into());
    }

    #[cfg(target_os = "macos")]
    {
        if !accessibility::is_trusted() {
            return Err(
                "未获得辅助功能权限，无法自动粘贴文本。请在「系统设置 → 隐私与安全性 → 辅助功能」中开启 AiMaMi。".into(),
            );
        }

        // 注入前校验前台应用未变。`expected_bundle_id` 为空字符串视为"未记录"，跳过校验。
        if let Some(expected) = expected_bundle_id {
            let expected = expected.trim();
            if !expected.is_empty() {
                let current = frontmost_application_info()
                    .map(|(bundle, _)| bundle)
                    .unwrap_or_default();
                if current.is_empty() {
                    return Err("无法读取前台应用，已取消粘贴避免误注入。".into());
                }
                if current != expected {
                    return Err(format!(
                        "前台应用已切换（原: {expected} → 现: {current}），已取消自动粘贴避免误注入。"
                    ));
                }
            }
        }

        let backup = pasteboard_current_string();
        if !pasteboard_write_string(text) {
            return Err("写入剪贴板失败".into());
        }

        post_command_v_keystroke()?;

        sleep(RESTORE_DELAY);

        if let Some(previous) = backup {
            let _ = pasteboard_write_string(&previous);
        }

        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = accessibility::is_trusted();
        let _ = text;
        let _ = expected_bundle_id;
        Err("当前平台暂不支持自动粘贴".into())
    }
}

/// Captured context at the moment recording starts.
#[derive(Debug, Clone, Default)]
pub struct CapturedContext {
    pub selected_text: String,
    pub clipboard_text: String,
    pub target_bundle_id: String,
    pub target_app_name: String,
}

/// Capture the current clipboard content and selected text (via Cmd+C).
///
/// Must be called *before* recording starts so we capture what the user had
/// selected when they pressed the trigger key.
pub fn capture_context() -> CapturedContext {
    #[cfg(target_os = "macos")]
    {
        let clipboard_text = pasteboard_current_string().unwrap_or_default();

        let selected_text = if accessibility::is_trusted() {
            capture_selected_text().unwrap_or_default()
        } else {
            String::new()
        };

        let (target_bundle_id, target_app_name) = frontmost_application_info().unwrap_or_default();

        CapturedContext {
            selected_text,
            clipboard_text,
            target_bundle_id,
            target_app_name,
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        CapturedContext::default()
    }
}

#[cfg(target_os = "macos")]
fn frontmost_application_info() -> Option<(String, String)> {
    let workspace_cls: &AnyClass = class!(NSWorkspace);
    let workspace: *mut AnyObject = unsafe { msg_send![workspace_cls, sharedWorkspace] };
    if workspace.is_null() {
        return None;
    }
    let app: *mut AnyObject = unsafe { msg_send![workspace, frontmostApplication] };
    if app.is_null() {
        return None;
    }
    let bundle_id: *mut NSString = unsafe { msg_send![app, bundleIdentifier] };
    if bundle_id.is_null() {
        return None;
    }
    let name: *mut NSString = unsafe { msg_send![app, localizedName] };
    let bundle_id = unsafe { &*bundle_id }.to_string();
    let app_name = if name.is_null() {
        String::new()
    } else {
        unsafe { &*name }.to_string()
    };
    Some((bundle_id, app_name))
}

#[cfg(target_os = "macos")]
fn capture_selected_text() -> Option<String> {
    let backup = pasteboard_current_string();

    let source = unsafe { CGEventSourceCreate(K_CG_EVENT_SOURCE_STATE_HID_SYSTEM_STATE) };
    if source.is_null() {
        return None;
    }

    let down = unsafe { CGEventCreateKeyboardEvent(source, 8, true) }; // C key
    let up = unsafe { CGEventCreateKeyboardEvent(source, 8, false) };
    if down.is_null() || up.is_null() {
        unsafe {
            if !down.is_null() {
                CFRelease(down as *const c_void);
            }
            if !up.is_null() {
                CFRelease(up as *const c_void);
            }
            CFRelease(source as *const c_void);
        }
        return None;
    }

    unsafe {
        CGEventSetFlags(down, K_CG_EVENT_FLAG_MASK_COMMAND);
        CGEventSetFlags(up, K_CG_EVENT_FLAG_MASK_COMMAND);
        CGEventPost(K_CG_HID_EVENT_TAP, down);
        CGEventPost(K_CG_HID_EVENT_TAP, up);
        CFRelease(down as *const c_void);
        CFRelease(up as *const c_void);
        CFRelease(source as *const c_void);
    }

    sleep(Duration::from_millis(80));

    let selected = pasteboard_current_string().unwrap_or_default();

    if let Some(prev) = backup {
        let _ = pasteboard_write_string(&prev);
    }

    if selected.trim().is_empty() {
        None
    } else {
        Some(selected)
    }
}

// ---------------------------------------------------------------------------
// NSPasteboard helpers（macOS only）
// ---------------------------------------------------------------------------

#[cfg(target_os = "macos")]
fn general_pasteboard() -> *mut AnyObject {
    let cls: &AnyClass = class!(NSPasteboard);
    unsafe { msg_send![cls, generalPasteboard] }
}

#[cfg(target_os = "macos")]
fn pasteboard_type_string() -> objc2::rc::Retained<NSString> {
    NSString::from_str(NS_PASTEBOARD_TYPE_STRING)
}

/// 读出当前 `NSPasteboard.generalPasteboard` 里的 public.utf8-plain-text 字符串。
#[cfg(target_os = "macos")]
fn pasteboard_current_string() -> Option<String> {
    let pb = general_pasteboard();
    if pb.is_null() {
        return None;
    }
    let type_ns = pasteboard_type_string();
    let value: *mut NSString = unsafe { msg_send![pb, stringForType: &*type_ns] };
    if value.is_null() {
        return None;
    }
    let ns_ref: &NSString = unsafe { &*value };
    Some(ns_ref.to_string())
}

/// 清空当前剪贴板并写入指定字符串。返回 `true` 表示写入成功。
#[cfg(target_os = "macos")]
fn pasteboard_write_string(text: &str) -> bool {
    let pb = general_pasteboard();
    if pb.is_null() {
        return false;
    }

    // macOS 10.6+ 的推荐路径：先 clearContents 把所有已存在的 type 清空并取得
    // changeCount，然后 setString:forType: 写入。setString 内部会自动替我们
    // declareTypes，所以不需要手动维护 NSArray<NSPasteboardType>，避免 objc2
    // 的范型交叉带来的类型噪音。
    let _: NSInteger = unsafe { msg_send![pb, clearContents] };
    let type_ns = pasteboard_type_string();
    let payload = NSString::from_str(text);
    let ok: bool = unsafe { msg_send![pb, setString: &*payload, forType: &*type_ns] };
    ok
}

// ---------------------------------------------------------------------------
// Cmd+V 键盘事件合成
// ---------------------------------------------------------------------------

#[cfg(target_os = "macos")]
fn post_command_v_keystroke() -> Result<(), String> {
    // 创建 CGEventSource，返回的指针归我们所有，必须 CFRelease。
    let source = unsafe { CGEventSourceCreate(K_CG_EVENT_SOURCE_STATE_HID_SYSTEM_STATE) };
    if source.is_null() {
        return Err("创建 CGEventSource 失败".into());
    }

    // 按下与抬起两个事件都带上 Command flag，确保接收端把它当作 Cmd+V。
    let down = unsafe { CGEventCreateKeyboardEvent(source, VIRTUAL_KEY_V, true) };
    if down.is_null() {
        unsafe { CFRelease(source as *const c_void) };
        return Err("创建 Cmd+V (down) 事件失败".into());
    }
    let up = unsafe { CGEventCreateKeyboardEvent(source, VIRTUAL_KEY_V, false) };
    if up.is_null() {
        unsafe {
            CFRelease(down as *const c_void);
            CFRelease(source as *const c_void);
        }
        return Err("创建 Cmd+V (up) 事件失败".into());
    }

    unsafe {
        CGEventSetFlags(down, K_CG_EVENT_FLAG_MASK_COMMAND);
        CGEventSetFlags(up, K_CG_EVENT_FLAG_MASK_COMMAND);
        CGEventPost(K_CG_HID_EVENT_TAP, down);
        CGEventPost(K_CG_HID_EVENT_TAP, up);
        CFRelease(down as *const c_void);
        CFRelease(up as *const c_void);
        CFRelease(source as *const c_void);
    }
    Ok(())
}
