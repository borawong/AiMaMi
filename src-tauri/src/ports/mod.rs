//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: ports::mod
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

#![allow(dead_code)]

mod audio;
mod auth_store;
mod clock;
mod config_store;
mod daemon;
mod http;
mod paths;
mod process;
mod quota_store;
mod registry_store;
mod skill_store;
mod window;

pub(crate) use audio::AudioPort;
pub(crate) use auth_store::AuthStore;
pub(crate) use clock::ClockPort;
pub(crate) use config_store::ConfigStore;
pub(crate) use daemon::DaemonPort;
pub(crate) use http::HttpPort;
pub(crate) use paths::PathsPort;
pub(crate) use process::ProcessPort;
pub(crate) use quota_store::QuotaStore;
pub(crate) use registry_store::RegistryStore;
pub(crate) use skill_store::SkillStore;
pub(crate) use window::WindowPort;
