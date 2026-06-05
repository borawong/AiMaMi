//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::voice
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{CoreEnvelope, VoiceWorkspacePayload};

#[derive(Default)]
pub(crate) struct VoiceService;

impl VoiceService {
    pub(crate) fn workspace(&self) -> CoreEnvelope<VoiceWorkspacePayload> {
        CoreEnvelope::ok_with_warnings(
            VoiceWorkspacePayload::default(),
            vec![crate::contracts::stub_warning("voice")],
        )
    }
}
