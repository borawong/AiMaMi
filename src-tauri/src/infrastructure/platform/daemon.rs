//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::platform::daemon
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::DaemonPort;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellDaemon;

impl DaemonPort for ShellDaemon {
    fn run_once(&self) -> Result<(), String> {
        Ok(())
    }
}
