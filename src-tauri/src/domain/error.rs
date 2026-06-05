//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: domain::error
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

#[derive(Debug, Clone, thiserror::Error)]
pub(crate) enum DomainError {
    #[error("domain behavior is not implemented in the backend shell")]
    NotImplemented,
}
