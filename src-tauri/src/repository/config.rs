use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use std::sync::Arc;

/// 中文职责说明：配置文件仓储 owner，只封装配置路径和 FS 边界，不解释产品状态机。
#[derive(Clone)]
pub(crate) struct ConfigRepository {
    _fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl ConfigRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { _fs: fs, paths }
    }

    pub(crate) fn source_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::ConfigSource)
    }

    pub(crate) fn voice_source_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::VoiceSource)
    }
}
