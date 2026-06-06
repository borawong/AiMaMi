use crate::core::dto::{BackendOperationEffect, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::core::migration;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CoreWarning {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CoreEnvelope<T: Serialize> {
    pub schema_version: i32,
    pub success: bool,
    pub code: String,
    pub message: String,
    pub warnings: Vec<CoreWarning>,
    pub data: T,
}

impl<T: Serialize> CoreEnvelope<T> {
    pub(crate) fn ok(data: T) -> Self {
        Self {
            schema_version: migration::current_schema_version().0,
            success: true,
            code: "ok".into(),
            message: "成功。".into(),
            warnings: Vec::new(),
            data,
        }
    }

    pub(crate) fn ok_with_warnings(data: T, warnings: Vec<CoreWarning>) -> Self {
        Self {
            schema_version: migration::current_schema_version().0,
            success: true,
            code: "ok".into(),
            message: "成功。".into(),
            warnings,
            data,
        }
    }

    pub(crate) fn pending(data: T, action: &str) -> Self {
        Self {
            schema_version: migration::current_schema_version().0,
            success: true,
            code: "backend_behavior_pending".into(),
            message: "当前后端保留命令契约，业务实现由后续 PR 在既有边界内补齐。".into(),
            warnings: vec![pending_warning(action)],
            data,
        }
    }

    pub(crate) fn no_op(data: T, action: &str) -> Self {
        Self {
            schema_version: migration::current_schema_version().0,
            success: true,
            code: "no_op".into(),
            message: "命令已接收，当前后端未执行副作用。".into(),
            warnings: vec![no_op_warning(action)],
            data,
        }
    }

    pub(crate) fn unsupported(data: T, action: &str) -> Self {
        Self {
            schema_version: migration::current_schema_version().0,
            success: true,
            code: "unsupported".into(),
            message: "命令契约已保留，当前后端拒绝伪实现未证实业务。".into(),
            warnings: vec![unsupported_warning(action)],
            data,
        }
    }

    pub(crate) fn from_backend_plan(data: T, plan: &BackendOperationPlan) -> Self {
        match plan.effect() {
            BackendOperationEffect::Pending => Self::pending(data, plan.command()),
            BackendOperationEffect::NoOp => Self::no_op(data, plan.command()),
            BackendOperationEffect::Platform => Self::platform(data, plan.command()),
            BackendOperationEffect::Unsupported => Self::unsupported(data, plan.command()),
        }
    }

    pub(crate) fn platform(data: T, action: &str) -> Self {
        Self {
            schema_version: migration::current_schema_version().0,
            success: true,
            code: "platform_only".into(),
            message: "命令已通过平台适配层执行，不代表闭源业务状态机已经恢复。".into(),
            warnings: vec![platform_warning(action)],
            data,
        }
    }

    pub(crate) fn failure(data: T, error: &CoreError) -> Self {
        Self {
            schema_version: migration::current_schema_version().0,
            success: false,
            code: error.code().to_owned(),
            message: error.public_message().to_owned(),
            warnings: vec![CoreWarning {
                code: error.code().to_owned(),
                message: error.public_message().to_owned(),
            }],
            data,
        }
    }
}

pub(crate) fn pending_warning(action: &str) -> CoreWarning {
    CoreWarning {
        code: "backend_behavior_pending".into(),
        message: format!(
            "{action} 保留后端契约；未恢复业务实现是项目选择，后续 PR 可沿 owner 边界补齐。"
        ),
    }
}

pub(crate) fn no_op_warning(action: &str) -> CoreWarning {
    CoreWarning {
        code: "no_op".into(),
        message: format!("{action} 已返回结构化结果，当前没有执行文件、进程或系统副作用。"),
    }
}

pub(crate) fn platform_warning(action: &str) -> CoreWarning {
    CoreWarning {
        code: "platform_only".into(),
        message: format!("{action} 已通过平台适配器执行；闭源业务状态机仍保持骨架契约。"),
    }
}

pub(crate) fn unsupported_warning(action: &str) -> CoreWarning {
    CoreWarning {
        code: "unsupported".into(),
        message: format!("{action} 缺少仓库内证据，当前仅保留后端命令契约。"),
    }
}
