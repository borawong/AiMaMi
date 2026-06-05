//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::hotspot
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::HotspotStatePayload;

#[derive(Default)]
pub(crate) struct HotspotService;

impl HotspotService {
    pub(crate) fn state(&self) -> HotspotStatePayload {
        HotspotStatePayload {
            supported: false,
            enabled: false,
        }
    }

    pub(crate) fn set_enabled(&self, enabled: bool) -> bool {
        enabled
    }
}
