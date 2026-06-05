//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::platform
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

mod audio;
mod daemon;
mod process;
mod update;
mod window;

pub(crate) use audio::ShellAudio;
pub(crate) use daemon::ShellDaemon;
pub(crate) use process::ShellProcess;
pub(crate) use update::installability;
pub(crate) use window::{has_notch_screen, ShellWindow};
