//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: contracts::hotspot
//! Current role: DTO contract
//! Future integration point: replace this stub through the declared port/use-case boundary.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HotspotStatePayload {
    pub supported: bool,
    pub enabled: bool,
}
