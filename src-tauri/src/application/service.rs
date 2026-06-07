use crate::application::ports::{
    HotspotRuntimePort, PermissionsPort, ProcessPort, ShellPort, WindowPort,
};
use crate::application::usecase::{
    accounts::AccountsUseCase, analytics::AnalyticsUseCase,
    custom_instructions::CustomInstructionsUseCase, daemon::DaemonUseCase, mcp::McpUseCase,
    relay::RelayUseCase, runtime_extensions::RuntimeExtensionsUseCase, sessions::SessionsUseCase,
    skills::SkillsUseCase, system::SystemUseCase, voice::VoiceUseCase,
};
use crate::core::single_flight::SingleFlight;
use crate::platform::{
    hotspot::SystemHotspotRuntime, permissions::SystemPermissions, process::SystemProcess,
    shell::SystemShell, system::CurrentSystem, window::NoopWindow,
};
use crate::repository::RepositoryBundle;

use crate::contracts::{CoreEnvelope, SystemActionPayload};
use crate::core::error::CoreError;

pub(crate) struct BackendServices {
    repositories: RepositoryBundle,
    single_flight: SingleFlight,
    process: Box<dyn ProcessPort>,
    shell: Box<dyn ShellPort>,
    permissions: Box<dyn PermissionsPort>,
    system_info: CurrentSystem,
    hotspot: Box<dyn HotspotRuntimePort>,
    window: Box<dyn WindowPort>,
}

impl Default for BackendServices {
    fn default() -> Self {
        Self::with_window(Box::new(NoopWindow))
    }
}

impl BackendServices {
    pub(crate) fn with_window(window: Box<dyn WindowPort>) -> Self {
        Self::with_platform_adapters(
            window,
            Box::new(SystemProcess),
            Box::new(SystemShell),
            Box::new(SystemPermissions),
            Box::new(SystemHotspotRuntime),
        )
    }

    pub(crate) fn with_platform_adapters(
        window: Box<dyn WindowPort>,
        process: Box<dyn ProcessPort>,
        shell: Box<dyn ShellPort>,
        permissions: Box<dyn PermissionsPort>,
        hotspot: Box<dyn HotspotRuntimePort>,
    ) -> Self {
        Self {
            repositories: RepositoryBundle::real(),
            single_flight: SingleFlight::default(),
            process,
            shell,
            permissions,
            system_info: CurrentSystem,
            hotspot,
            window,
        }
    }

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

    pub(crate) fn restart_application(
        &self,
    ) -> Result<CoreEnvelope<SystemActionPayload>, CoreError> {
        self.system().restart_application(self.process.as_ref())
    }

    pub(crate) fn graceful_restart_for_update(
        &self,
    ) -> Result<CoreEnvelope<SystemActionPayload>, CoreError> {
        self.system()
            .graceful_restart_for_update(self.process.as_ref())
    }

    pub(crate) fn open_path(
        &self,
        path: String,
    ) -> Result<CoreEnvelope<SystemActionPayload>, CoreError> {
        self.system().open_path(self.shell.as_ref(), path)
    }

    pub(crate) fn open_privacy_pane(
        &self,
        pane: String,
    ) -> Result<CoreEnvelope<SystemActionPayload>, CoreError> {
        self.system()
            .open_privacy_pane(self.permissions.as_ref(), pane)
    }

    pub(crate) fn focus_main_window(&self) -> Result<CoreEnvelope<SystemActionPayload>, CoreError> {
        self.system().focus_main_window(self.window.as_ref())
    }

    pub(crate) fn hotspot_ready(&self) -> Result<CoreEnvelope<bool>, CoreError> {
        self.system().hotspot_ready(self.hotspot.as_ref())
    }
}
