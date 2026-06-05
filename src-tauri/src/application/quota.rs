//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::quota
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{CoreEnvelope, QuotaHistoryPayload};

#[derive(Default)]
pub(crate) struct QuotaService;

impl QuotaService {
    pub(crate) fn history(&self) -> CoreEnvelope<QuotaHistoryPayload> {
        CoreEnvelope::ok_with_warnings(
            QuotaHistoryPayload::default(),
            vec![crate::contracts::stub_warning("quota")],
        )
    }
}
