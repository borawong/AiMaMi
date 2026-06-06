use crate::contracts::{BackendSkeletonStatus, CoreEnvelope, SessionsPayload};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

const MODULE: &str = "sessions";

/// 中文职责说明：会话列表与删除事务 owner，真实会话文件解析后续在本边界内补齐。
pub(crate) struct SessionsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> SessionsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_sessions(&self) -> Result<CoreEnvelope<SessionsPayload>, CoreError> {
        let plan = self.pending_plan("load_sessions");
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, Vec::new()),
            &plan,
        ))
    }

    pub(crate) fn delete_sessions(
        &self,
        ids: Vec<String>,
    ) -> Result<CoreEnvelope<SessionsPayload>, CoreError> {
        let ids = required_text_list(ids, "empty_session_ids", "会话标识列表不能为空。")?;
        let plan = self.no_op_plan("delete_sessions");
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, ids),
            &plan,
        ))
    }

    fn payload(&self, plan: &BackendOperationPlan, ids: Vec<String>) -> SessionsPayload {
        SessionsPayload {
            status: BackendSkeletonStatus::from_plan(plan),
            ids,
            ..Default::default()
        }
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
