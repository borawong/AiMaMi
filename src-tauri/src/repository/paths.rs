use crate::core::error::CoreError;
use crate::repository::path_guard::ensure_relative_path;
use std::path::{Component, Path, PathBuf};
use std::sync::Arc;

#[derive(Clone, Debug)]
pub(crate) struct RepositoryPathContext {
    root: Arc<PathBuf>,
}

impl Default for RepositoryPathContext {
    fn default() -> Self {
        Self {
            root: Arc::new(PathBuf::from("state")),
        }
    }
}

impl RepositoryPathContext {
    pub(crate) fn from_relative_root(root: impl Into<PathBuf>) -> Result<Self, CoreError> {
        let root = root.into();
        ensure_relative_path(&root)?;
        Ok(Self {
            root: Arc::new(root),
        })
    }

    pub(crate) fn resolve(&self, path: RepositoryPath) -> PathBuf {
        let mut resolved = (*self.root).clone();
        for segment in path.segments() {
            resolved.push(segment);
        }
        resolved
    }

    pub(crate) fn contract_string(&self, path: RepositoryPath) -> String {
        display_relative_path(&self.resolve(path))
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum RepositoryPath {
    AccountsSource,
    AnalyticsSource,
    ConfigSource,
    McpSource,
    VoiceSource,
    CustomInstructionsSource,
    RegistrySource,
    RelaySource,
    RuntimeExtensionsSource,
    SessionsSource,
    SkillsRoot,
    SkillBackupsRoot,
    QuotaSource,
}

impl RepositoryPath {
    fn segments(self) -> &'static [&'static str] {
        match self {
            Self::AccountsSource => &["accounts", "accounts.json"],
            Self::AnalyticsSource => &["analytics", "usage.json"],
            Self::ConfigSource => &["config", "config.json"],
            Self::McpSource => &["config", "mcp.json"],
            Self::VoiceSource => &["config", "voice.json"],
            Self::CustomInstructionsSource => &["custom-instructions", "templates.json"],
            Self::RegistrySource => &["registry", "registry.json"],
            Self::RelaySource => &["relay", "relay.json"],
            Self::RuntimeExtensionsSource => &["runtime-extensions", "plugins.json"],
            Self::SessionsSource => &["sessions", "sessions.json"],
            Self::SkillsRoot => &["skills", "installed"],
            Self::SkillBackupsRoot => &["skills", "backups"],
            Self::QuotaSource => &["quota", "history.json"],
        }
    }
}

fn display_relative_path(path: &Path) -> String {
    path.components()
        .filter_map(|component| match component {
            Component::CurDir => Some(".".to_owned()),
            Component::Normal(value) => Some(value.to_string_lossy().into_owned()),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join("/")
}

#[cfg(test)]
mod tests {
    use super::{RepositoryPath, RepositoryPathContext};

    #[test]
    fn default_context_derives_paths_from_relative_root() {
        let context = RepositoryPathContext::default();

        assert_eq!(
            context.contract_string(RepositoryPath::ConfigSource),
            "state/config/config.json"
        );
        assert_eq!(
            context.contract_string(RepositoryPath::SkillBackupsRoot),
            "state/skills/backups"
        );
        assert_eq!(
            context.contract_string(RepositoryPath::McpSource),
            "state/config/mcp.json"
        );
        assert_eq!(
            context.contract_string(RepositoryPath::VoiceSource),
            "state/config/voice.json"
        );
    }

    #[test]
    fn context_rejects_parent_traversal() {
        let error = RepositoryPathContext::from_relative_root("../state")
            .expect_err("parent traversal must be rejected");

        assert_eq!(error.code(), "repository.parent_path_rejected");
    }
}
