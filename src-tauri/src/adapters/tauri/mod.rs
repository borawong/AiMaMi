//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

pub(crate) mod commands;
pub(crate) mod lifecycle;
pub(crate) mod tray;
pub(crate) mod window;

pub(crate) use lifecycle::run;
