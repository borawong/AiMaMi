//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::platform::update
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::UpdateInstallabilityPayload;

pub(crate) fn installability() -> UpdateInstallabilityPayload {
    UpdateInstallabilityPayload::default()
}
