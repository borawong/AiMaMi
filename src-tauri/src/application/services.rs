//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::services
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::application::{
    custom_instructions::CustomInstructionsService, daemon::DaemonService, hotspot::HotspotService,
    mcp::McpService, skills::SkillsService, snapshot::SnapshotService, system::SystemService,
    voice::VoiceService,
};

#[derive(Default)]
pub(crate) struct BackendServices {
    snapshot: SnapshotService,
    system: SystemService,
    mcp: McpService,
    skills: SkillsService,
    custom_instructions: CustomInstructionsService,
    hotspot: HotspotService,
    daemon: DaemonService,
    voice: VoiceService,
}

impl BackendServices {
    pub(crate) fn snapshot(&self) -> &SnapshotService {
        &self.snapshot
    }

    pub(crate) fn system(&self) -> &SystemService {
        &self.system
    }

    pub(crate) fn mcp(&self) -> &McpService {
        &self.mcp
    }

    pub(crate) fn skills(&self) -> &SkillsService {
        &self.skills
    }

    pub(crate) fn custom_instructions(&self) -> &CustomInstructionsService {
        &self.custom_instructions
    }

    pub(crate) fn hotspot(&self) -> &HotspotService {
        &self.hotspot
    }

    pub(crate) fn daemon(&self) -> &DaemonService {
        &self.daemon
    }

    pub(crate) fn voice(&self) -> &VoiceService {
        &self.voice
    }
}
