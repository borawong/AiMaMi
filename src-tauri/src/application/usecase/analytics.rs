use crate::contracts::{AnalyticsPayload, BackendSkeletonStatus, CoreEnvelope};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

const MODULE: &str = "analytics";

/// 中文职责说明：分析读取事务 owner，聚合算法后续只能在本边界内补齐。
pub(crate) struct AnalyticsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> AnalyticsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_usage(&self) -> Result<CoreEnvelope<AnalyticsPayload>, CoreError> {
        let plan = self.pending_plan("load_usage_analytics");
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, None, None),
            &plan,
        ))
    }

    pub(crate) fn load_quota_history(
        &self,
        account_key: Option<String>,
    ) -> Result<CoreEnvelope<AnalyticsPayload>, CoreError> {
        let plan = self.no_op_quota_plan("load_quota_history");
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, clean_optional_text(account_key), None),
            &plan,
        ))
    }

    pub(crate) fn load_range(
        &self,
        command: &'static str,
        range: Option<String>,
    ) -> Result<CoreEnvelope<AnalyticsPayload>, CoreError> {
        let plan = self.no_op_plan(command);
        let range = clean_optional_text(range).unwrap_or_else(|| "today".into());
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, None, Some(range)),
            &plan,
        ))
    }

    fn payload(
        &self,
        plan: &BackendOperationPlan,
        account_key: Option<String>,
        range: Option<String>,
    ) -> AnalyticsPayload {
        AnalyticsPayload {
            status: BackendSkeletonStatus::from_plan(plan),
            account_key,
            range,
            ..Default::default()
        }
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary())
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn no_op_quota_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.quota_repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.analytics().source_path())
    }

    fn quota_repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.quota().source_path())
    }
}

fn clean_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let value = value.trim().to_owned();
        if value.is_empty() {
            None
        } else {
            Some(value)
        }
    })
}
