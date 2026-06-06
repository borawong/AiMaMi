use crate::contracts::{
    BackendSkeletonStatus, CoreEnvelope, SessionsDeletePayload, SessionsListPayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

const MODULE: &str = "sessions";

pub(crate) struct SessionsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> SessionsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_sessions(&self) -> Result<CoreEnvelope<SessionsListPayload>, CoreError> {
        let plan = self.pending_plan("load_sessions");
        Ok(CoreEnvelope::from_backend_plan(
            SessionsListPayload {
                backend_status: self.status(&plan),
                items: Vec::new(),
                total: 0,
                source_path: self.repositories.sessions().source_path(),
                last_scan_at: 0,
            },
            &plan,
        ))
    }

    pub(crate) fn delete_sessions(
        &self,
        ids: Vec<String>,
    ) -> Result<CoreEnvelope<SessionsDeletePayload>, CoreError> {
        let ids = required_text_list(ids, "empty_session_ids", "会话标识列表不能为空。")?;
        let plan = self.no_op_plan("delete_sessions");
        Ok(CoreEnvelope::from_backend_plan(
            SessionsDeletePayload {
                backend_status: self.status(&plan),
                requested_ids: ids.clone(),
                deleted_count: ids.len(),
                deleted_ids: ids,
                skipped_ids: Vec::new(),
                source_path: self.repositories.sessions().source_path(),
            },
            &plan,
        ))
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary())
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.sessions().source_path())
    }

    fn status(&self, plan: &BackendOperationPlan) -> BackendSkeletonStatus {
        BackendSkeletonStatus::from_plan(plan)
    }
}

fn required_text_list(
    values: Vec<String>,
    code: &'static str,
    public_message: &'static str,
) -> Result<Vec<String>, CoreError> {
    let values = values
        .into_iter()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
        .collect::<Vec<_>>();
    if values.is_empty() {
        Err(CoreError::domain(code, public_message))
    } else {
        Ok(values)
    }
}
