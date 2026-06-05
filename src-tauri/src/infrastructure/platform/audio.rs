//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::platform::audio
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::AudioPort;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellAudio;

impl AudioPort for ShellAudio {
    fn restore(&self) {}
}
