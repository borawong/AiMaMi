use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use std::sync::Arc;

/// 中文职责说明：语音配置仓储 owner，只封装语音工作区配置路径和可替换 FS 边界。
#[derive(Clone)]
pub(crate) struct VoiceRepository {
    _fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl VoiceRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { _fs: fs, paths }
    }

    pub(crate) fn source_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::VoiceSource)
    }
}
