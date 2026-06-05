//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: contracts::envelope
//! Current role: DTO contract
//! Future integration point: replace this stub through the declared port/use-case boundary.

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
            schema_version: 1,
            success: true,
            code: "ok".into(),
            message: "Success".into(),
            warnings: Vec::new(),
            data,
        }
    }

    pub(crate) fn ok_with_warnings(data: T, warnings: Vec<CoreWarning>) -> Self {
        Self {
            schema_version: 1,
            success: true,
            code: "ok".into(),
            message: "Success".into(),
            warnings,
            data,
        }
    }

    pub(crate) fn no_op(data: T, action: &str) -> Self {
        Self {
            schema_version: 1,
            success: true,
            code: "no_op".into(),
            message: "No operation was performed.".into(),
            warnings: vec![no_op_warning(action)],
            data,
        }
    }
}

pub(crate) fn stub_warning(layer: &str) -> CoreWarning {
    CoreWarning {
        code: "backend_stub".into(),
        message: format!(
            "The {layer} backend surface is intentionally stubbed; business behavior is not restored."
        ),
    }
}

pub(crate) fn no_op_warning(action: &str) -> CoreWarning {
    CoreWarning {
        code: "no_op".into(),
        message: format!("{action} accepted by the shell backend without side effects."),
    }
}
