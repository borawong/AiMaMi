//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::commands
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

pub(crate) mod custom_instructions;
pub(crate) mod hotspot;
pub(crate) mod mcp;
pub(crate) mod skills;
pub(crate) mod system;
