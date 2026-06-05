//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::stores
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

mod bootstrap;
mod config;
mod custom_instructions;
mod quota;
mod registry;
mod skills;

pub(crate) use bootstrap::ShellBootstrapStore;
pub(crate) use config::ShellConfigStore;
pub(crate) use custom_instructions::ShellCustomInstructionStore;
pub(crate) use quota::ShellQuotaStore;
pub(crate) use registry::ShellRegistryStore;
pub(crate) use skills::ShellSkillStore;
