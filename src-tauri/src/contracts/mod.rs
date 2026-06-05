//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: contracts::mod
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

mod analytics;
mod custom_instructions;
mod envelope;
mod hotspot;
mod mcp;
mod skills;
mod snapshot;
mod system;
mod voice;

pub(crate) use analytics::*;
pub(crate) use custom_instructions::*;
pub(crate) use envelope::*;
pub(crate) use hotspot::*;
pub(crate) use mcp::*;
pub(crate) use skills::*;
pub(crate) use snapshot::*;
pub(crate) use system::*;
pub(crate) use voice::*;
