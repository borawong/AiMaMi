use crate::contracts::{AutoSwitchRuntimeState, CoreEnvelope, DaemonRunPayload};
use crate::core::error::CoreError;
use crate::core::single_flight::SingleFlight;
use crate::repository::RepositoryBundle;

/// 中文职责说明：后台守护进程单次运行事务 owner，负责 single-flight 和仓储边界组织。
pub(crate) struct DaemonUseCase<'a> {
    repositories: &'a RepositoryBundle,
    single_flight: &'a SingleFlight,
}

impl<'a> DaemonUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle, single_flight: &'a SingleFlight) -> Self {
        Self {
            repositories,
            single_flight,
        }
    }

    pub(crate) fn run_once(&self) -> Result<CoreEnvelope<DaemonRunPayload>, CoreError> {
        let _permit = self.single_flight.begin("daemon.run_once")?;
        let _ = self.repositories.config().source_path();
        Ok(CoreEnvelope::no_op(
            DaemonRunPayload {
                executed_at: 0,
                run_once: true,
                auto_switch_enabled: false,
                service_state: AutoSwitchRuntimeState::Unknown,
            },
            "run_daemon_once",
        ))
    }

    pub(crate) fn run_once_cli(&self) -> Result<DaemonRunPayload, CoreError> {
        Ok(self.run_once()?.data)
    }
}
