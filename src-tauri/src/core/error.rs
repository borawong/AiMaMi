use thiserror::Error;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CoreErrorCategory {
    Domain,
    Repository,
    Platform,
    Runtime,
}

impl CoreErrorCategory {
    fn code_prefix(self) -> &'static str {
        match self {
            Self::Domain => "domain",
            Self::Repository => "repository",
            Self::Platform => "platform",
            Self::Runtime => "runtime",
        }
    }
}

#[derive(Debug, Clone, Error)]
#[error("{code}: {public_message}")]
pub(crate) struct CoreError {
    category: CoreErrorCategory,
    code: String,
    public_message: String,
    diagnostic: Option<String>,
}

impl CoreError {
    pub(crate) fn domain(code: &str, public_message: &str) -> Self {
        Self::new(CoreErrorCategory::Domain, code, public_message)
    }

    pub(crate) fn repository(code: &str, public_message: &str) -> Self {
        Self::new(CoreErrorCategory::Repository, code, public_message)
    }

    pub(crate) fn platform(code: &str, public_message: &str) -> Self {
        Self::new(CoreErrorCategory::Platform, code, public_message)
    }

    pub(crate) fn runtime(code: &str, public_message: &str) -> Self {
        Self::new(CoreErrorCategory::Runtime, code, public_message)
    }

    pub(crate) fn with_diagnostic(mut self, diagnostic: impl Into<String>) -> Self {
        self.diagnostic = Some(redact_diagnostic(&diagnostic.into()));
        self
    }

    pub(crate) fn code(&self) -> &str {
        &self.code
    }

    pub(crate) fn public_message(&self) -> &str {
        &self.public_message
    }

    pub(crate) fn category(&self) -> CoreErrorCategory {
        self.category
    }

    fn new(category: CoreErrorCategory, code: &str, public_message: &str) -> Self {
        Self {
            category,
            code: format!("{}.{}", category.code_prefix(), code),
            public_message: public_message.to_owned(),
            diagnostic: None,
        }
    }
}

fn redact_diagnostic(value: &str) -> String {
    if value.contains('\\') || value.contains('/') || value.contains('@') {
        "[已脱敏诊断]".into()
    } else {
        value.chars().take(120).collect()
    }
}
