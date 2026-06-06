pub(crate) mod accounts;
pub(crate) mod adapter;
pub(crate) mod analytics;
pub(crate) mod config;
pub(crate) mod custom_instructions;
pub(crate) mod mcp;
pub(crate) mod path_guard;
pub(crate) mod paths;
pub(crate) mod quota;
pub(crate) mod registry;
pub(crate) mod relay;
pub(crate) mod runtime_extensions;
pub(crate) mod sessions;
pub(crate) mod skills;
pub(crate) mod voice;

use crate::repository::accounts::AccountsRepository;
use crate::repository::adapter::real_fs::RealFileSystem;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::analytics::AnalyticsRepository;
use crate::repository::config::ConfigRepository;
use crate::repository::custom_instructions::CustomInstructionsRepository;
use crate::repository::mcp::McpRepository;
use crate::repository::paths::RepositoryPathContext;
use crate::repository::quota::QuotaRepository;
use crate::repository::registry::RegistryRepository;
use crate::repository::relay::RelayRepository;
use crate::repository::runtime_extensions::RuntimeExtensionsRepository;
use crate::repository::sessions::SessionsRepository;
use crate::repository::skills::SkillsRepository;
use crate::repository::voice::VoiceRepository;
use std::sync::Arc;

#[derive(Clone)]
pub(crate) struct RepositoryBundle {
    accounts: AccountsRepository,
    analytics: AnalyticsRepository,
    config: ConfigRepository,
    registry: RegistryRepository,
    mcp: McpRepository,
    relay: RelayRepository,
    runtime_extensions: RuntimeExtensionsRepository,
    sessions: SessionsRepository,
    skills: SkillsRepository,
    voice: VoiceRepository,
    quota: QuotaRepository,
    custom_instructions: CustomInstructionsRepository,
}

impl RepositoryBundle {
    pub(crate) fn real() -> Self {
        Self::with_fs(Arc::new(RealFileSystem))
    }

    pub(crate) fn with_fs(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self::with_context(fs, RepositoryPathContext::default())
    }

    pub(crate) fn with_context(
        fs: Arc<dyn FileSystemAdapter>,
        paths: RepositoryPathContext,
    ) -> Self {
        Self {
            accounts: AccountsRepository::new(fs.clone(), paths.clone()),
            analytics: AnalyticsRepository::new(fs.clone(), paths.clone()),
            config: ConfigRepository::new(fs.clone(), paths.clone()),
            registry: RegistryRepository::new(fs.clone(), paths.clone()),
            mcp: McpRepository::new(fs.clone(), paths.clone()),
            relay: RelayRepository::new(fs.clone(), paths.clone()),
            runtime_extensions: RuntimeExtensionsRepository::new(fs.clone(), paths.clone()),
            sessions: SessionsRepository::new(fs.clone(), paths.clone()),
            skills: SkillsRepository::new(fs.clone(), paths.clone()),
            voice: VoiceRepository::new(fs.clone(), paths.clone()),
            quota: QuotaRepository::new(fs.clone(), paths.clone()),
            custom_instructions: CustomInstructionsRepository::new(fs, paths),
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

    pub(crate) fn mcp(&self) -> &McpRepository {
        &self.mcp
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

    pub(crate) fn voice(&self) -> &VoiceRepository {
        &self.voice
    }

    pub(crate) fn quota(&self) -> &QuotaRepository {
        &self.quota
    }

    pub(crate) fn custom_instructions(&self) -> &CustomInstructionsRepository {
        &self.custom_instructions
    }
}
