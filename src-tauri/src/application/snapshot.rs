//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::snapshot
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{stub_warning, CoreEnvelope, CoreSnapshotPayload};

#[derive(Default)]
pub(crate) struct SnapshotService;

impl SnapshotService {
    pub(crate) fn load_snapshot(&self, _local_only: bool) -> CoreEnvelope<CoreSnapshotPayload> {
        CoreEnvelope::ok_with_warnings(
            CoreSnapshotPayload::default(),
            vec![stub_warning("snapshot")],
        )
    }
}
