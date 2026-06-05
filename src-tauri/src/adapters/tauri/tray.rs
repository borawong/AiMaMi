//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::tray
//! Current role: Tauri command adapter
//! Future integration point: replace this stub through the declared port/use-case boundary.

pub(crate) fn install(_app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}
