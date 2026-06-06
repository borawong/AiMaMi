use crate::contracts::{
    BackendSkeletonStatus, ChangeAnalyticsPayload, CoreEnvelope, QuotaHistoryPayload,
    SessionAnalyticsPayload, TokenAnalyticsPayload, ToolAnalyticsPayload, UsageAnalyticsPayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

const MODULE: &str = "analytics";

pub(crate) struct AnalyticsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> AnalyticsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_usage(&self) -> Result<CoreEnvelope<UsageAnalyticsPayload>, CoreError> {
        let plan = self.pending_plan("load_usage_analytics");
        Ok(CoreEnvelope::from_backend_plan(
            UsageAnalyticsPayload {
                backend_status: self.status(&plan),
                ..Default::default()
            },
            &plan,
        ))
    }

    pub(crate) fn load_quota_history(
        &self,
        account_key: Option<String>,
    ) -> Result<CoreEnvelope<QuotaHistoryPayload>, CoreError> {
        let plan = self.no_op_quota_plan("load_quota_history");
        Ok(CoreEnvelope::from_backend_plan(
            QuotaHistoryPayload {
                backend_status: self.status(&plan),
                account_key: clean_optional_text(account_key),
                points: Vec::new(),
            },
            &plan,
        ))
    }

    pub(crate) fn load_session_analytics(
        &self,
        range: Option<String>,
    ) -> Result<CoreEnvelope<SessionAnalyticsPayload>, CoreError> {
        let plan = self.no_op_plan("load_session_analytics");
        Ok(CoreEnvelope::from_backend_plan(
            SessionAnalyticsPayload {
                backend_status: self.status(&plan),
                range: self.analytics_range(range),
                total_sessions: 0,
                avg_turns: 0.0,
                active_days: 0,
                series: Vec::new(),
            },
            &plan,
        ))
    }

    pub(crate) fn load_token_analytics(
        &self,
        range: Option<String>,
    ) -> Result<CoreEnvelope<TokenAnalyticsPayload>, CoreError> {
        let plan = self.no_op_plan("load_token_analytics");
        Ok(CoreEnvelope::from_backend_plan(
            TokenAnalyticsPayload {
                backend_status: self.status(&plan),
                range: self.analytics_range(range),
                ..Default::default()
            },
            &plan,
        ))
    }

    pub(crate) fn load_tool_analytics(
        &self,
        range: Option<String>,
    ) -> Result<CoreEnvelope<ToolAnalyticsPayload>, CoreError> {
        let plan = self.no_op_plan("load_tool_analytics");
        Ok(CoreEnvelope::from_backend_plan(
            ToolAnalyticsPayload {
                backend_status: self.status(&plan),
                range: self.analytics_range(range),
                ..Default::default()
            },
            &plan,
        ))
    }

    pub(crate) fn load_change_analytics(
        &self,
        range: Option<String>,
    ) -> Result<CoreEnvelope<ChangeAnalyticsPayload>, CoreError> {
        let plan = self.no_op_plan("load_change_analytics");
        Ok(CoreEnvelope::from_backend_plan(
            ChangeAnalyticsPayload {
                backend_status: self.status(&plan),
                range: self.analytics_range(range),
                ..Default::default()
            },
            &plan,
        ))
    }

    fn analytics_range(&self, value: Option<String>) -> String {
        clean_optional_text(value).unwrap_or_else(|| "week".into())
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

    fn status(&self, plan: &BackendOperationPlan) -> BackendSkeletonStatus {
        BackendSkeletonStatus::from_plan(plan)
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
