use crate::core::error::CoreError;
use crate::repository::path_guard::ensure_relative_path;
use std::path::{Component, Path, PathBuf};
use std::sync::Arc;

/// 中文职责说明：仓储路径上下文只保存可重建的相对根，不保存跨命令业务状态。
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
    /// 中文职责说明：由平台层或测试层注入相对根，真实用户目录不得写入仓储合同。
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

/// 中文职责说明：后端仓储的文件和目录合同枚举；真实解析、迁移和业务规则由 core/usecase 后续补证。
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum RepositoryPath {
    AccountsSource,
    AnalyticsSource,
    ConfigSource,
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
    }

    #[test]
    fn context_rejects_parent_traversal() {
        let error = RepositoryPathContext::from_relative_root("../state")
            .expect_err("parent traversal must be rejected");

        assert_eq!(error.code(), "repository.parent_path_rejected");
    }
}
