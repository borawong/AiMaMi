//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::platform::process
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::ProcessPort;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellProcess;

impl ProcessPort for ShellProcess {
    fn restart(&self) -> Result<(), String> {
        Ok(())
    }
}
