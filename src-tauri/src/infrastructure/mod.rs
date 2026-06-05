//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::mod
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

#![allow(dead_code)]

mod http;
mod paths;
mod platform;
mod stores;

use crate::contracts::UpdateInstallabilityPayload;
use crate::ports::{
    AudioPort, ConfigStore, DaemonPort, HttpPort, PathsPort, ProcessPort, QuotaStore,
    RegistryStore, SkillStore, WindowPort,
};
use http::ShellHttpClient;
use paths::ShellPaths;
use platform::{ShellAudio, ShellDaemon, ShellProcess, ShellWindow};
use stores::{
    ShellBootstrapStore, ShellConfigStore, ShellCustomInstructionStore, ShellQuotaStore,
    ShellRegistryStore, ShellSkillStore,
};

#[derive(Debug, Clone, Default)]
pub(crate) struct BackendInfrastructure {
    http: ShellHttpClient,
    paths: ShellPaths,
    audio: ShellAudio,
    daemon: ShellDaemon,
    process: ShellProcess,
    window: ShellWindow,
    bootstrap_store: ShellBootstrapStore,
    config_store: ShellConfigStore,
    custom_instruction_store: ShellCustomInstructionStore,
    quota_store: ShellQuotaStore,
    registry_store: ShellRegistryStore,
    skill_store: ShellSkillStore,
}

impl BackendInfrastructure {
    pub(crate) fn new() -> Self {
        Self::default()
    }

    pub(crate) fn http(&self) -> &dyn HttpPort {
        &self.http
    }

    pub(crate) fn paths(&self) -> &dyn PathsPort {
        &self.paths
    }

    pub(crate) fn audio(&self) -> &dyn AudioPort {
        &self.audio
    }

    pub(crate) fn daemon(&self) -> &dyn DaemonPort {
        &self.daemon
    }

    pub(crate) fn process(&self) -> &dyn ProcessPort {
        &self.process
    }

    pub(crate) fn window(&self) -> &dyn WindowPort {
        &self.window
    }

    pub(crate) fn has_notch_screen(&self) -> bool {
        platform::has_notch_screen()
    }

    pub(crate) fn update_installability(&self) -> UpdateInstallabilityPayload {
        platform::installability()
    }

    pub(crate) fn bootstrap_enabled(&self) -> bool {
        self.bootstrap_store.enabled()
    }

    pub(crate) fn config_store(&self) -> &dyn ConfigStore {
        &self.config_store
    }

    pub(crate) fn custom_instruction_store(&self) -> &dyn ConfigStore {
        &self.custom_instruction_store
    }

    pub(crate) fn quota_store(&self) -> &dyn QuotaStore {
        &self.quota_store
    }

    pub(crate) fn registry_store(&self) -> &dyn RegistryStore {
        &self.registry_store
    }

    pub(crate) fn skill_store(&self) -> &dyn SkillStore {
        &self.skill_store
    }
}
