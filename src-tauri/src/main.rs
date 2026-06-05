#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::process
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

fn main() {
    if std::env::args().nth(1).as_deref() == Some("daemon-run-once") {
        if let Err(error) = aimami_lib::run_daemon_once_cli() {
            eprintln!("{error}");
            std::process::exit(1);
        }
        return;
    }

    aimami_lib::run()
}
