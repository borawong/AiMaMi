use serde::{Deserialize, Serialize};

/// 中文职责说明：标记后端闭源业务未在本仓库恢复，但命令契约与六边形 owner 已落位。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BackendSkeletonStatus {
    pub module: String,
    pub command: String,
    pub restored: bool,
    pub note: String,
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
        }
    }
}
