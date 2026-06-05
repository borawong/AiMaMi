//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::platform::window
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::WindowPort;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellWindow;

impl WindowPort for ShellWindow {
    fn focus_main(&self) -> Result<(), String> {
        Ok(())
    }
}

pub(crate) fn has_notch_screen() -> bool {
    false
}
