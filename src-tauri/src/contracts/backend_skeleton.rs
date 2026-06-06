use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use serde::{Deserialize, Serialize};

/// 中文职责说明：骨架边界状态用于 IPC 侧说明命令已经过哪些后端 owner，不暴露路径和业务细节。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BackendSkeletonBoundaryStatus {
    pub repository_checked: bool,
    pub repository_path_known: bool,
    pub platform_checked: bool,
    pub core_checked: bool,
    pub effect: String,
}

impl Default for BackendSkeletonBoundaryStatus {
    fn default() -> Self {
        Self::from_boundary(BackendBoundaryProbe::unchecked(), "pending")
    }
}

impl BackendSkeletonBoundaryStatus {
    pub(crate) fn from_plan(plan: &BackendOperationPlan) -> Self {
        Self::from_boundary(plan.boundary(), plan.effect().code())
    }

    fn from_boundary(boundary: BackendBoundaryProbe, effect: &str) -> Self {
        Self {
            repository_checked: boundary.repository_checked(),
            repository_path_known: boundary.repository_path_known(),
            platform_checked: boundary.platform_checked(),
            core_checked: boundary.core_checked(),
            effect: effect.to_owned(),
        }
    }
}

/// 中文职责说明：标记后端闭源业务未在本仓库恢复，但命令契约与六边形 owner 已落位。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BackendSkeletonStatus {
    pub module: String,
    pub command: String,
    pub restored: bool,
    pub note: String,
    #[serde(default)]
    pub boundary: BackendSkeletonBoundaryStatus,
}

impl Default for BackendSkeletonStatus {
    fn default() -> Self {
        Self::for_command("unknown", "unknown")
    }
}

impl BackendSkeletonStatus {
    pub(crate) fn for_command(module: &'static str, command: &'static str) -> Self {
        Self {
            module: module.into(),
            command: command.into(),
            restored: false,
            note: "后端业务实现由后续 PR 在当前边界内补齐".into(),
            boundary: BackendSkeletonBoundaryStatus::default(),
        }
    }

    pub(crate) fn from_plan(plan: &BackendOperationPlan) -> Self {
        Self {
            module: plan.module().into(),
            command: plan.command().into(),
            restored: plan.effect().restored(),
            note: plan.note().into(),
            boundary: BackendSkeletonBoundaryStatus::from_plan(plan),
        }
    }
}
