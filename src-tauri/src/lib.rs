//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::composition
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

mod adapters;
mod application;
mod contracts;
mod domain;
mod infrastructure;
mod ports;

pub fn run() {
    adapters::tauri::run();
}

pub fn run_daemon_once_cli() -> Result<(), String> {
    application::BackendServices::default()
        .daemon()
        .run_once_cli()
        .map(|_| ())
}
