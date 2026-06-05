//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: domain::mcp
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub(crate) struct ServerRef {
    pub name: String,
}
