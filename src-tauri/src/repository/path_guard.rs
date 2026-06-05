use crate::core::error::CoreError;
use std::path::{Component, Path};

/// 中文职责说明：仓储路径安全门，拒绝绝对路径和越过仓储根目录的相对路径。
pub(crate) fn ensure_relative_path(path: &Path) -> Result<(), CoreError> {
    if path.is_absolute() {
        return Err(CoreError::repository(
            "absolute_path_rejected",
            "仓储路径必须是相对路径。",
        ));
    }
    if path
        .components()
        .any(|component| matches!(component, Component::ParentDir))
    {
        return Err(CoreError::repository(
            "parent_path_rejected",
            "仓储路径不能越过根目录。",
        ));
    }
    Ok(())
}

/// 中文职责说明：对外展示路径时只保留文件名，避免泄露机器路径或用户目录。
pub(crate) fn safe_display_path(path: &Path) -> String {
    path.file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_owned()
}
