//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::stores::quota
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::QuotaStore;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellQuotaStore;

impl QuotaStore for ShellQuotaStore {
    fn point_count(&self) -> i32 {
        0
    }
}
