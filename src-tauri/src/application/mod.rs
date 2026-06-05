//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::mod
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

mod auth;
mod custom_instructions;
mod daemon;
mod hotspot;
mod mcp;
mod quota;
mod registry;
mod services;
mod skills;
mod snapshot;
mod system;
mod voice;

pub(crate) use services::BackendServices;
