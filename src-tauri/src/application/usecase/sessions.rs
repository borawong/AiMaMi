use crate::contracts::{BackendSkeletonStatus, CoreEnvelope, SessionsPayload};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

/// 中文职责说明：会话列表与删除事务 owner，真实会话文件解析后续在本边界内补齐。
pub(crate) struct SessionsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> SessionsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_sessions(&self) -> Result<CoreEnvelope<SessionsPayload>, CoreError> {
        let _source_path = self.repositories.sessions().source_path();
        Ok(CoreEnvelope::pending(
            self.payload("load_sessions", Vec::new()),
            "load_sessions",
        ))
    }

    pub(crate) fn delete_sessions(
        &self,
        ids: Vec<String>,
    ) -> Result<CoreEnvelope<SessionsPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            self.payload("delete_sessions", ids),
            "delete_sessions",
        ))
    }

    fn payload(&self, command: &'static str, ids: Vec<String>) -> SessionsPayload {
        SessionsPayload {
            status: BackendSkeletonStatus::for_command("sessions", command),
            ids,
            ..Default::default()
        }
    }
}
