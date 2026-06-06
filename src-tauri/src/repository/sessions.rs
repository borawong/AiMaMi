use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use std::sync::Arc;

/// 中文职责说明：会话仓储 owner，只表达会话文件存储边界，真实解析后续补证据。
#[derive(Clone)]
pub(crate) struct SessionsRepository {
    _fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl SessionsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { _fs: fs, paths }
    }

    pub(crate) fn source_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::SessionsSource)
    }
}
