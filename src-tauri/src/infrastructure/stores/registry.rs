//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::stores::registry
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::RegistryStore;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellRegistryStore;

impl RegistryStore for ShellRegistryStore {
    fn account_count(&self) -> i32 {
        0
    }
}
