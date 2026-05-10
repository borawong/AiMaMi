//! macOS 系统输出音量管理：保存、降低、恢复。
//!
//! 通过 CoreAudio HAL `kAudioHardwareServiceDeviceProperty_VirtualMainVolume` 直接读写
//! 默认输出设备的虚拟主音量，替换原先 `osascript` 子进程方案：
//!  - 不再触发 macOS 13+ 的「自动化」权限弹窗；
//!  - 消除每次调用 ~100ms 的子进程派生延迟；
//!  - 不依赖 AppleScript 子系统，锁屏 / 屏幕保护下也可用。
//!
//! 崩溃恢复：进入 ducking 时把原音量写入数据目录下的 marker 文件，应用下次启动时若
//! marker 仍存在则把音量恢复到记录值并清理 marker。这样录音过程中即便强杀 / 崩溃，
//! 下次启动会自动还原音量，而不是永久停在低音状态。
//!
//! 与 Type4Me `Services/SystemVolumeManager.swift` 思路一致（MIT），细节按本项目数据
//! 目录约定改写：marker 走 `<codex_home>/codexmate/voice-volume-marker.json`，而不是
//! UserDefaults。

#![cfg(target_os = "macos")]

use std::ffi::c_void;
use std::path::{Path, PathBuf};
use std::sync::{mpsc, Mutex, OnceLock};

use crate::platform::paths::CodexPaths;

/// 当前会话已记录过原始音量时不再覆盖——避免一次会话内多次 apply 把"原始"覆盖成已经降过的值。
static SAVED_VOLUME: Mutex<Option<f32>> = Mutex::new(None);
static VOLUME_WORKER: OnceLock<mpsc::Sender<VolumeOperation>> = OnceLock::new();

/// 当前音量低于此阈值视为本身就是静音状态，不再 ducking，避免错误地把"近似 0"记录为原始音量
/// 之后恢复时反而拉不回去。与 Type4Me 阈值一致。
const MIN_VOLUME_TO_DUCK: f32 = 0.05;

enum VolumeOperation {
    Lower(f32),
    Restore,
}

/// Lowers the default output volume to a fraction of the current level.
/// For example, `target_fraction = 0.3` means 30% of the current system volume.
///
/// Behavior:
///  - the original volume is saved only once per session;
///  - current volume at or below `MIN_VOLUME_TO_DUCK` is skipped, matching Type4Me;
///  - CoreAudio work runs on a background thread because Bluetooth devices can
///    occasionally stall `AudioObject*PropertyData`.
pub fn lower(target_fraction: f32) {
    let fraction = target_fraction.clamp(0.0, 1.0);
    let _ = volume_worker().send(VolumeOperation::Lower(fraction));
}

fn lower_inner(fraction: f32) {
    let Some(device) = default_output_device() else {
        return;
    };
    let Some(current) = get_volume(device) else {
        return;
    };
    if current <= MIN_VOLUME_TO_DUCK {
        return;
    }

    let need_save = match SAVED_VOLUME.lock() {
        Ok(mut saved) => {
            if saved.is_some() {
                false
            } else {
                *saved = Some(current);
                true
            }
        }
        Err(_) => return,
    };
    if need_save {
        write_marker(current);
    }

    let target = current * fraction;
    let _ = set_volume(device, target);
}

/// 恢复到 `lower()` 调用前的音量并清理 marker。
/// 异步执行，行为与 `lower()` 对称。
pub fn restore() {
    let _ = volume_worker().send(VolumeOperation::Restore);
}

fn restore_inner() {
    let saved = match SAVED_VOLUME.lock() {
        Ok(mut s) => s.take(),
        Err(_) => return,
    };
    let Some(saved) = saved else {
        // 内存里没有记录，但 marker 也可能因崩溃残留——一并清理。
        clear_marker();
        return;
    };

    if let Some(device) = default_output_device() {
        let _ = set_volume(device, saved);
    }
    clear_marker();
}

fn volume_worker() -> &'static mpsc::Sender<VolumeOperation> {
    VOLUME_WORKER.get_or_init(|| {
        let (tx, rx) = mpsc::channel::<VolumeOperation>();
        let _ = std::thread::Builder::new()
            .name("aimami-system-volume".to_string())
            .spawn(move || {
                while let Ok(op) = rx.recv() {
                    match op {
                        VolumeOperation::Lower(target) => lower_inner(target),
                        VolumeOperation::Restore => restore_inner(),
                    }
                }
            });
        tx
    })
}

/// 应用启动时调用：若 marker 文件仍存在（意味着上次会话没正常 restore），把音量恢复并清掉 marker。
/// 同步执行，因为发生在 UI 显示前，且只读 marker 文件 + 一次 CoreAudio set，开销极小。
pub fn restore_if_needed_at_startup() {
    let Some(saved) = read_marker() else { return };
    if let Some(device) = default_output_device() {
        let _ = set_volume(device, saved);
    }
    clear_marker();
}

// -- Marker file --------------------------------------------------------------

fn marker_path() -> PathBuf {
    CodexPaths::new()
        .codexmate_dir
        .join("voice-volume-marker.json")
}

fn write_marker(volume: f32) {
    let path = marker_path();
    if let Some(parent) = path.parent().map(Path::to_path_buf) {
        let _ = std::fs::create_dir_all(parent);
    }
    let body = format!("{{\"saved\":{:.4}}}", volume);
    let _ = std::fs::write(&path, body);
}

fn read_marker() -> Option<f32> {
    let raw = std::fs::read_to_string(marker_path()).ok()?;
    // 极简解析：仅期望 `{"saved":0.6500}` 这种我们自己写出去的格式。
    let key = "\"saved\":";
    let idx = raw.find(key)?;
    let rest = &raw[idx + key.len()..];
    let end = rest
        .find(|c: char| !c.is_ascii_digit() && c != '.' && c != '-')
        .unwrap_or(rest.len());
    rest[..end].trim().parse::<f32>().ok()
}

fn clear_marker() {
    let _ = std::fs::remove_file(marker_path());
}

// -- CoreAudio FFI ------------------------------------------------------------

#[repr(C)]
struct AudioObjectPropertyAddress {
    selector: u32,
    scope: u32,
    element: u32,
}

const fn fcc(s: &[u8; 4]) -> u32 {
    ((s[0] as u32) << 24) | ((s[1] as u32) << 16) | ((s[2] as u32) << 8) | (s[3] as u32)
}

const K_AUDIO_OBJECT_SYSTEM_OBJECT: u32 = 1;
const K_AUDIO_HARDWARE_PROPERTY_DEFAULT_OUTPUT_DEVICE: u32 = fcc(b"dOut");
/// 系统主音量（菜单栏 / 系统设置那个滑块）的 selector。
/// 历史名 `kAudioHardwareServiceDeviceProperty_VirtualMainVolume`，selector 值 'vmvc'。
/// 现代 SDK 里 `AudioHardwareService*` 函数族已被移除，但 selector 本身仍可被
/// `AudioObject*` 函数族识别（前提是目标设备支持）。某些设备（多通道 USB / 部分蓝牙）
/// 不支持此 selector，需要回退到 per-channel `volm`。
const K_VIRTUAL_MAIN_VOLUME: u32 = fcc(b"vmvc");
/// `kAudioDevicePropertyVolumeScalar`：单通道 0..=1 标量音量。
/// 用作 `vmvc` 的 fallback：遍历输出通道 (element 1, 2, ..) 分别 get/set。
const K_VOLUME_SCALAR: u32 = fcc(b"volm");
/// `kAudioDevicePropertyPreferredChannelsForStereo`：默认立体声左右通道编号（element index）。
/// 用于决定 fallback 时遍历哪两个通道。失败时回退到 [1, 2]。
const K_PREFERRED_CHANNELS_FOR_STEREO: u32 = fcc(b"dch2");
const K_AUDIO_OBJECT_PROPERTY_SCOPE_GLOBAL: u32 = fcc(b"glob");
const K_AUDIO_DEVICE_PROPERTY_SCOPE_OUTPUT: u32 = fcc(b"outp");
const K_AUDIO_OBJECT_PROPERTY_ELEMENT_MAIN: u32 = 0;

#[link(name = "CoreAudio", kind = "framework")]
extern "C" {
    fn AudioObjectGetPropertyData(
        in_object_id: u32,
        in_address: *const AudioObjectPropertyAddress,
        in_qualifier_data_size: u32,
        in_qualifier_data: *const c_void,
        io_data_size: *mut u32,
        out_data: *mut c_void,
    ) -> i32;

    fn AudioObjectSetPropertyData(
        in_object_id: u32,
        in_address: *const AudioObjectPropertyAddress,
        in_qualifier_data_size: u32,
        in_qualifier_data: *const c_void,
        in_data_size: u32,
        in_data: *const c_void,
    ) -> i32;
}

fn default_output_device() -> Option<u32> {
    let address = AudioObjectPropertyAddress {
        selector: K_AUDIO_HARDWARE_PROPERTY_DEFAULT_OUTPUT_DEVICE,
        scope: K_AUDIO_OBJECT_PROPERTY_SCOPE_GLOBAL,
        element: K_AUDIO_OBJECT_PROPERTY_ELEMENT_MAIN,
    };
    let mut device_id: u32 = 0;
    let mut size: u32 = std::mem::size_of::<u32>() as u32;
    let status = unsafe {
        AudioObjectGetPropertyData(
            K_AUDIO_OBJECT_SYSTEM_OBJECT,
            &address,
            0,
            std::ptr::null(),
            &mut size,
            &mut device_id as *mut u32 as *mut c_void,
        )
    };
    if status == 0 && device_id != 0 {
        Some(device_id)
    } else {
        None
    }
}

/// 读取当前默认输出设备的音量（0..=1）。
/// 优先尝试 `vmvc` 主音量；失败则回退到 `volm` per-channel，取所有可读通道的平均值。
fn get_volume(device: u32) -> Option<f32> {
    if let Some(v) = get_volume_with(
        device,
        K_VIRTUAL_MAIN_VOLUME,
        K_AUDIO_OBJECT_PROPERTY_ELEMENT_MAIN,
    ) {
        return Some(v);
    }
    // Fallback：vmvc 在某些设备上不可读，遍历 stereo channel 求均值。
    let channels = preferred_stereo_channels(device);
    let mut sum: f32 = 0.0;
    let mut count: u32 = 0;
    for ch in channels {
        if let Some(v) = get_volume_with(device, K_VOLUME_SCALAR, ch) {
            sum += v;
            count += 1;
        }
    }
    if count > 0 {
        Some(sum / count as f32)
    } else {
        None
    }
}

/// 设置当前默认输出设备的音量（0..=1）。
/// 优先尝试 `vmvc` 主音量；失败则对所有立体声通道分别 set。任何一个通道 set 成功都视为成功，
/// 因为系统会同步剩余通道（macOS 自身的"主音量"实际就是把多通道平均处理）。
fn set_volume(device: u32, volume: f32) -> bool {
    let value = volume.clamp(0.0, 1.0);
    if set_volume_with(
        device,
        K_VIRTUAL_MAIN_VOLUME,
        K_AUDIO_OBJECT_PROPERTY_ELEMENT_MAIN,
        value,
    ) {
        return true;
    }
    let channels = preferred_stereo_channels(device);
    let mut any_ok = false;
    for ch in channels {
        if set_volume_with(device, K_VOLUME_SCALAR, ch, value) {
            any_ok = true;
        }
    }
    any_ok
}

fn get_volume_with(device: u32, selector: u32, element: u32) -> Option<f32> {
    let address = AudioObjectPropertyAddress {
        selector,
        scope: K_AUDIO_DEVICE_PROPERTY_SCOPE_OUTPUT,
        element,
    };
    let mut volume: f32 = 0.0;
    let mut size: u32 = std::mem::size_of::<f32>() as u32;
    let status = unsafe {
        AudioObjectGetPropertyData(
            device,
            &address,
            0,
            std::ptr::null(),
            &mut size,
            &mut volume as *mut f32 as *mut c_void,
        )
    };
    if status == 0 {
        Some(volume)
    } else {
        None
    }
}

fn set_volume_with(device: u32, selector: u32, element: u32, value: f32) -> bool {
    let address = AudioObjectPropertyAddress {
        selector,
        scope: K_AUDIO_DEVICE_PROPERTY_SCOPE_OUTPUT,
        element,
    };
    let status = unsafe {
        AudioObjectSetPropertyData(
            device,
            &address,
            0,
            std::ptr::null(),
            std::mem::size_of::<f32>() as u32,
            &value as *const f32 as *const c_void,
        )
    };
    status == 0
}

/// 查询设备的「立体声左右通道」编号；失败时回退到 `[1, 2]`（CoreAudio channel 编号从 1 开始）。
/// CoreAudio 多通道 selector 的 element 即通道号。
fn preferred_stereo_channels(device: u32) -> [u32; 2] {
    let address = AudioObjectPropertyAddress {
        selector: K_PREFERRED_CHANNELS_FOR_STEREO,
        scope: K_AUDIO_DEVICE_PROPERTY_SCOPE_OUTPUT,
        element: K_AUDIO_OBJECT_PROPERTY_ELEMENT_MAIN,
    };
    let mut channels: [u32; 2] = [0; 2];
    let mut size: u32 = std::mem::size_of::<[u32; 2]>() as u32;
    let status = unsafe {
        AudioObjectGetPropertyData(
            device,
            &address,
            0,
            std::ptr::null(),
            &mut size,
            channels.as_mut_ptr() as *mut c_void,
        )
    };
    if status == 0 && channels[0] > 0 && channels[1] > 0 {
        channels
    } else {
        [1, 2]
    }
}
