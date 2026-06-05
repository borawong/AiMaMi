use crate::contracts::{AnalyticsPayload, BackendSkeletonStatus, CoreEnvelope};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

/// 中文职责说明：分析读取事务 owner，聚合算法后续只能在本边界内补齐。
pub(crate) struct AnalyticsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> AnalyticsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_usage(&self) -> Result<CoreEnvelope<AnalyticsPayload>, CoreError> {
        let _source_path = self.repositories.analytics().source_path();
        Ok(CoreEnvelope::pending(
            self.payload("load_usage_analytics", None, None),
            "load_usage_analytics",
        ))
    }

    pub(crate) fn load_quota_history(
        &self,
        account_key: Option<String>,
    ) -> Result<CoreEnvelope<AnalyticsPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            self.payload("load_quota_history", account_key, None),
            "load_quota_history",
        ))
    }

    pub(crate) fn load_range(
        &self,
        command: &'static str,
        range: Option<String>,
    ) -> Result<CoreEnvelope<AnalyticsPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            self.payload(command, None, Some(range.unwrap_or_else(|| "today".into()))),
            command,
        ))
    }

    fn payload(
        &self,
        command: &'static str,
        account_key: Option<String>,
        range: Option<String>,
    ) -> AnalyticsPayload {
        AnalyticsPayload {
            status: BackendSkeletonStatus::for_command("analytics", command),
            account_key,
            range,
            ..Default::default()
        }
    }
}
