use crate::application::usecase::{
    accounts::AccountsUseCase, analytics::AnalyticsUseCase,
    custom_instructions::CustomInstructionsUseCase, daemon::DaemonUseCase, mcp::McpUseCase,
    relay::RelayUseCase, runtime_extensions::RuntimeExtensionsUseCase, sessions::SessionsUseCase,
    skills::SkillsUseCase, system::SystemUseCase, voice::VoiceUseCase,
};
use crate::core::single_flight::SingleFlight;
use crate::platform::{
    permissions::NoopPermissions, process::NoopProcess, shell::NoopShell, system::CurrentSystem,
};
use crate::repository::RepositoryBundle;
use serde_json::Value;

use crate::contracts::CoreEnvelope;
use crate::core::error::CoreError;

/// 中文职责说明：后端服务组合根，只装配仓储、single-flight、平台端口和 usecase 入口。
pub(crate) struct BackendServices {
    repositories: RepositoryBundle,
    single_flight: SingleFlight,
    process: NoopProcess,
    shell: NoopShell,
    permissions: NoopPermissions,
    system_info: CurrentSystem,
}

impl Default for BackendServices {
    fn default() -> Self {
        Self {
            repositories: RepositoryBundle::real(),
            single_flight: SingleFlight::default(),
            process: NoopProcess::default(),
            shell: NoopShell::default(),
            permissions: NoopPermissions::default(),
            system_info: CurrentSystem,
        }
    }
}

impl BackendServices {
    pub(crate) fn system(&self) -> SystemUseCase<'_> {
        SystemUseCase::new(&self.repositories, &self.single_flight, &self.system_info)
    }

    pub(crate) fn accounts(&self) -> AccountsUseCase<'_> {
        AccountsUseCase::new(&self.repositories)
    }

    pub(crate) fn analytics(&self) -> AnalyticsUseCase<'_> {
        AnalyticsUseCase::new(&self.repositories)
    }

    pub(crate) fn mcp(&self) -> McpUseCase<'_> {
        McpUseCase::new(&self.repositories)
    }

    pub(crate) fn relay(&self) -> RelayUseCase<'_> {
        RelayUseCase::new(&self.repositories)
    }

    pub(crate) fn runtime_extensions(&self) -> RuntimeExtensionsUseCase<'_> {
        RuntimeExtensionsUseCase::new(&self.repositories)
    }

    pub(crate) fn sessions(&self) -> SessionsUseCase<'_> {
        SessionsUseCase::new(&self.repositories)
    }

    pub(crate) fn skills(&self) -> SkillsUseCase<'_> {
        SkillsUseCase::new(&self.repositories)
    }

    pub(crate) fn custom_instructions(&self) -> CustomInstructionsUseCase<'_> {
        CustomInstructionsUseCase::new(&self.repositories)
    }

    pub(crate) fn daemon(&self) -> DaemonUseCase<'_> {
        DaemonUseCase::new(&self.repositories, &self.single_flight)
    }

    pub(crate) fn voice(&self) -> VoiceUseCase<'_> {
        VoiceUseCase::new(&self.repositories)
    }

    pub(crate) fn restart_application(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        self.system().restart_application(&self.process)
    }

    pub(crate) fn graceful_restart_for_update(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        self.system().graceful_restart_for_update(&self.process)
    }

    pub(crate) fn open_path(&self, path: String) -> Result<CoreEnvelope<Value>, CoreError> {
        self.system().open_path(&self.shell, path)
    }

    pub(crate) fn open_privacy_pane(&self, pane: String) -> Result<CoreEnvelope<Value>, CoreError> {
        self.system().open_privacy_pane(&self.permissions, pane)
    }
}
