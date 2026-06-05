pub(crate) mod accounts;
pub(crate) mod adapter;
pub(crate) mod analytics;
pub(crate) mod config;
pub(crate) mod custom_instructions;
pub(crate) mod path_guard;
pub(crate) mod quota;
pub(crate) mod registry;
pub(crate) mod relay;
pub(crate) mod runtime_extensions;
pub(crate) mod sessions;
pub(crate) mod skills;

use crate::repository::accounts::AccountsRepository;
use crate::repository::adapter::real_fs::RealFileSystem;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::analytics::AnalyticsRepository;
use crate::repository::config::ConfigRepository;
use crate::repository::custom_instructions::CustomInstructionsRepository;
use crate::repository::quota::QuotaRepository;
use crate::repository::registry::RegistryRepository;
use crate::repository::relay::RelayRepository;
use crate::repository::runtime_extensions::RuntimeExtensionsRepository;
use crate::repository::sessions::SessionsRepository;
use crate::repository::skills::SkillsRepository;
use std::sync::Arc;

/// 中文职责说明：仓储聚合根，只持有可替换 FS adapter 和可重建路径上下文，不保存跨命令业务状态。
#[derive(Clone)]
pub(crate) struct RepositoryBundle {
    accounts: AccountsRepository,
    analytics: AnalyticsRepository,
    config: ConfigRepository,
    registry: RegistryRepository,
    relay: RelayRepository,
    runtime_extensions: RuntimeExtensionsRepository,
    sessions: SessionsRepository,
    skills: SkillsRepository,
    quota: QuotaRepository,
    custom_instructions: CustomInstructionsRepository,
}

impl RepositoryBundle {
    /// 中文职责说明：生产入口使用真实 FS，具体读写仍由 repository/adapter 集中封装。
    pub(crate) fn real() -> Self {
        Self::with_fs(Arc::new(RealFileSystem))
    }

    /// 中文职责说明：测试或临时运行可注入 fake/temp FS，验证仓储契约时不触碰真实用户环境。
    pub(crate) fn with_fs(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self {
            accounts: AccountsRepository::new(fs.clone()),
            analytics: AnalyticsRepository::new(fs.clone()),
            config: ConfigRepository::new(fs.clone()),
            registry: RegistryRepository::new(fs.clone()),
            relay: RelayRepository::new(fs.clone()),
            runtime_extensions: RuntimeExtensionsRepository::new(fs.clone()),
            sessions: SessionsRepository::new(fs.clone()),
            skills: SkillsRepository::new(fs.clone()),
            quota: QuotaRepository::new(fs.clone()),
            custom_instructions: CustomInstructionsRepository::new(fs),
        }
    }

    pub(crate) fn accounts(&self) -> &AccountsRepository {
        &self.accounts
    }

    pub(crate) fn analytics(&self) -> &AnalyticsRepository {
        &self.analytics
    }

    pub(crate) fn config(&self) -> &ConfigRepository {
        &self.config
    }

    pub(crate) fn registry(&self) -> &RegistryRepository {
        &self.registry
    }

    pub(crate) fn relay(&self) -> &RelayRepository {
        &self.relay
    }

    pub(crate) fn runtime_extensions(&self) -> &RuntimeExtensionsRepository {
        &self.runtime_extensions
    }

    pub(crate) fn sessions(&self) -> &SessionsRepository {
        &self.sessions
    }

    pub(crate) fn skills(&self) -> &SkillsRepository {
        &self.skills
    }

    pub(crate) fn quota(&self) -> &QuotaRepository {
        &self.quota
    }

    pub(crate) fn custom_instructions(&self) -> &CustomInstructionsRepository {
        &self.custom_instructions
    }
}
