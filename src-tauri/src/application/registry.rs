//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::registry
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{CleanPayload, CoreEnvelope, RebuildRegistryPayload};

#[derive(Default)]
pub(crate) struct RegistryService;

impl RegistryService {
    pub(crate) fn clean(&self) -> CoreEnvelope<CleanPayload> {
        CoreEnvelope::no_op(CleanPayload::default(), "clean")
    }

    pub(crate) fn rebuild_registry(&self) -> CoreEnvelope<RebuildRegistryPayload> {
        CoreEnvelope::no_op(RebuildRegistryPayload::default(), "rebuild_registry")
    }
}
