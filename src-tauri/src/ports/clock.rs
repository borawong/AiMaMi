//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: ports::clock
//! Current role: port definition
//! Future integration point: replace this stub through the declared port/use-case boundary.

pub(crate) trait ClockPort: Send + Sync {
    fn now_seconds(&self) -> i64;
}
