//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::daemon
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{AutoSwitchRuntimeState, CoreEnvelope, DaemonRunPayload};

#[derive(Default)]
pub(crate) struct DaemonService;

impl DaemonService {
    pub(crate) fn run_once(&self) -> CoreEnvelope<DaemonRunPayload> {
        CoreEnvelope::no_op(
            DaemonRunPayload {
                executed_at: 0,
                run_once: true,
                auto_switch_enabled: false,
                service_state: AutoSwitchRuntimeState::Unknown,
            },
            "run_daemon_once",
        )
    }

    pub(crate) fn run_once_cli(&self) -> Result<DaemonRunPayload, String> {
        Ok(self.run_once().data)
    }
}
