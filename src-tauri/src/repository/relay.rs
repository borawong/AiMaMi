use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use std::sync::Arc;

/// 中文职责说明：Relay 配置仓储 owner，只封装配置文件边界，不执行代理启停。
#[derive(Clone)]
pub(crate) struct RelayRepository {
    _fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl RelayRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { _fs: fs, paths }
    }

    pub(crate) fn source_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::RelaySource)
    }
}
