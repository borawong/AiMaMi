//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::paths
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::PathsPort;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellPaths;

impl PathsPort for ShellPaths {
    fn app_home(&self) -> String {
        String::new()
    }
}
