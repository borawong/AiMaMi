//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::stores::bootstrap
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellBootstrapStore;

impl ShellBootstrapStore {
    pub(crate) fn enabled(&self) -> bool {
        false
    }
}
