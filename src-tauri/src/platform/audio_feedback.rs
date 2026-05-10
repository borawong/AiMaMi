//! System audio feedback for voice recording start/stop events.
//!
//! 提示音 wav（water-drop）由 macOS 端的 voice sidecar 加载并通过 AVAudioPlayer 播放，
//! 当前产品固定使用柔和水滴并跟随系统默认输出；sidecar 启动时会预热 player，
//! 避免首录时同步读盘 / 解码引发的几十毫秒延迟峰值。
//!
//! 本模块只提供 `PromptSoundStyle` 与 `volume ducking` 的稳定接口；实际把"播放命令"发往
//! standby sidecar 的 stdin 由 `core::voice_runtime` 负责，因为只有 voice_runtime 持有
//! 当前 sidecar handle。
//!
//! Windows: 暂未实现提示音播放（保留 stub）。

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PromptSoundStyle {
    /// 清脆水滴，对应资源 `voice/sounds/water-drop-1.wav`。
    WaterDrop1,
    /// 柔和水滴，对应资源 `voice/sounds/water-drop-2.wav`。
    WaterDrop2,
    None,
}

const WATER_DROP_1_WAV: &[u8] = include_bytes!("../../resources/voice/sounds/water-drop-1.wav");
const WATER_DROP_2_WAV: &[u8] = include_bytes!("../../resources/voice/sounds/water-drop-2.wav");
const FALLBACK_PROMPT_DURATION_MS: u64 = 500;
const BLUETOOTH_PRIMER_MS: u64 = 80;
const PROMPT_TAIL_MS: u64 = 50;

impl PromptSoundStyle {
    /// 解析历史配置中的提示音字符串；当前产品固定使用 `water2`。
    pub fn from_str_opt(s: &str) -> Self {
        match s {
            "water1" | "waterDrop1" => Self::WaterDrop1,
            "water2" | "waterDrop2" => Self::WaterDrop2,
            _ => Self::None,
        }
    }

    /// 与 sidecar `PromptSoundStyleSwift.rawValue` 一一对应的 wire token，
    /// 用于拼接 standby sidecar 命令 `play-sound <verb> <style> <output_uid>`。
    pub fn as_sidecar_token(&self) -> &'static str {
        match self {
            Self::WaterDrop1 => "water1",
            Self::WaterDrop2 => "water2",
            Self::None => "none",
        }
    }

    pub fn is_silent(&self) -> bool {
        matches!(self, Self::None)
    }

    pub fn start_ducking_delay_ms(&self) -> u64 {
        match self {
            Self::WaterDrop1 => prompt_ducking_delay_ms(WATER_DROP_1_WAV),
            Self::WaterDrop2 => prompt_ducking_delay_ms(WATER_DROP_2_WAV),
            Self::None => 0,
        }
    }
}

fn prompt_ducking_delay_ms(wav: &[u8]) -> u64 {
    wav_duration_ms(wav).unwrap_or(FALLBACK_PROMPT_DURATION_MS)
        + BLUETOOTH_PRIMER_MS
        + PROMPT_TAIL_MS
}

fn wav_duration_ms(wav: &[u8]) -> Option<u64> {
    if wav.len() < 12 || &wav[0..4] != b"RIFF" || &wav[8..12] != b"WAVE" {
        return None;
    }

    let mut offset = 12usize;
    let mut byte_rate: Option<u32> = None;
    let mut data_size: Option<u32> = None;
    while offset.checked_add(8)? <= wav.len() {
        let id = wav.get(offset..offset + 4)?;
        let size = u32::from_le_bytes(wav.get(offset + 4..offset + 8)?.try_into().ok()?);
        let chunk_start = offset + 8;
        let chunk_size = usize::try_from(size).ok()?;
        let chunk_end = chunk_start.checked_add(chunk_size)?;
        if chunk_end > wav.len() {
            return None;
        }

        if id == b"fmt " && chunk_size >= 16 {
            byte_rate = Some(u32::from_le_bytes(
                wav.get(chunk_start + 8..chunk_start + 12)?
                    .try_into()
                    .ok()?,
            ));
        } else if id == b"data" {
            data_size = Some(size);
        }

        if byte_rate.is_some() && data_size.is_some() {
            break;
        }
        offset = chunk_end + (chunk_size % 2);
    }

    let byte_rate = u64::from(byte_rate?);
    if byte_rate == 0 {
        return None;
    }
    let data_size = u64::from(data_size?);
    Some((data_size * 1000).div_ceil(byte_rate))
}

// -- Volume ducking -----------------------------------------------------------
//
// 录音期间临时降低系统输出音量。具体的 CoreAudio HAL 读写、状态保存与崩溃恢复
// 都在 `platform::system_volume` 模块里实现，本模块只承担「target_percent → fraction」
// 这一层语义换算，对外接口（apply / restore）保持稳定。
//
// UI semantics:
//  - `target_percent < 0`  → no-op, matching the "Off" option
//  - `target_percent == 0` → mute
//  - `1..=100`             → keep this percent of the current output volume
//  - `> 100`               → invalid value, no-op

#[cfg(target_os = "macos")]
pub fn apply_volume_ducking(target_percent: i16) {
    if !(0..=100).contains(&target_percent) {
        return;
    }
    super::system_volume::lower(target_percent as f32 / 100.0);
}

#[cfg(target_os = "macos")]
pub fn restore_volume() {
    super::system_volume::restore();
}

/// 应用启动时调用：若上次会话因崩溃 / 强杀未能 `restore_volume`，
/// 这里会读取 marker 文件恢复音量并清理 marker。
#[cfg(target_os = "macos")]
pub fn restore_volume_at_startup() {
    super::system_volume::restore_if_needed_at_startup();
}

#[cfg(not(target_os = "macos"))]
pub fn apply_volume_ducking(_target_percent: i16) {}

#[cfg(not(target_os = "macos"))]
pub fn restore_volume() {}

#[cfg(not(target_os = "macos"))]
pub fn restore_volume_at_startup() {}
