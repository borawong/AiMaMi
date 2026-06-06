use crate::contracts::{
    AutoSwitchRuntimeState, BackendSkeletonStatus, CoreEnvelope, DaemonRunPayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::core::single_flight::SingleFlight;
use crate::repository::RepositoryBundle;

const MODULE: &str = "daemon";

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
        let plan = self.no_op_plan("run_daemon_once");
        let _permit = self.single_flight.begin("daemon.run_once")?;
        Ok(CoreEnvelope::from_backend_plan(self.payload(&plan), &plan))
    }

    pub(crate) fn run_once_cli(&self) -> Result<DaemonRunPayload, CoreError> {
        Ok(self.run_once()?.data)
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.config().source_path())
    }

    fn payload(&self, plan: &BackendOperationPlan) -> DaemonRunPayload {
        DaemonRunPayload {
            backend_status: BackendSkeletonStatus::from_plan(plan),
            executed_at: 0,
            run_once: true,
            auto_switch_enabled: false,
            service_state: AutoSwitchRuntimeState::Unknown,
        }
    }
}
