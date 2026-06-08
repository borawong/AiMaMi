use crate::core::error::CoreError;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CoreWarning {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreEnvelope<T: Serialize> {
    pub schema_version: i32,
    pub success: bool,
    pub code: String,
    pub message: String,
    pub warnings: Vec<CoreWarning>,
    pub data: T,
}

impl<T: Serialize> CoreEnvelope<T> {
    pub fn ok(data: T) -> Self {
        Self {
            schema_version: 1,
            success: true,
            code: "ok".to_string(),
            message: "成功".to_string(),
            warnings: Vec::new(),
            data,
        }
    }

    pub fn ok_with_warnings(data: T, warnings: Vec<CoreWarning>) -> Self {
        Self {
            schema_version: 1,
            success: true,
            code: "ok".to_string(),
            message: "成功".to_string(),
            warnings,
            data,
        }
    }

    pub fn error(error: &CoreError, data: T) -> Self {
        Self {
            schema_version: 1,
            success: false,
            code: error.code().to_string(),
            message: error.sanitized_message(),
            warnings: Vec::new(),
            data,
        }
    }
}
