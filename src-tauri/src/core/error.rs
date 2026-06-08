#[derive(Debug, thiserror::Error)]
pub enum CoreError {
    #[error("文件系统错误：{0}")]
    Io(#[from] std::io::Error),
    #[error("JSON 错误：{0}")]
    Json(#[from] serde_json::Error),
    #[error("TOML 解析错误：{0}")]
    TomlParse(#[from] toml::de::Error),
    #[error("TOML 序列化错误：{0}")]
    TomlSerialize(#[from] toml::ser::Error),
    #[error("未找到：{0}")]
    NotFound(String),
    #[error("输入无效：{0}")]
    InvalidInput(String),
    #[error("平台能力不可用：{0}")]
    Unsupported(String),
    #[error("操作失败：{0}")]
    Operation(String),
}

impl CoreError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::Io(_) => "repository.io",
            Self::Json(_) => "core.json",
            Self::TomlParse(_) => "core.toml.parse",
            Self::TomlSerialize(_) => "core.toml.serialize",
            Self::NotFound(_) => "domain.not_found",
            Self::InvalidInput(_) => "domain.invalid_input",
            Self::Unsupported(_) => "platform.unsupported",
            Self::Operation(_) => "runtime.operation_failed",
        }
    }

    pub fn sanitized_message(&self) -> String {
        self.to_string()
    }
}
