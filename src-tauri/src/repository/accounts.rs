use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use std::sync::Arc;

/// 中文职责说明：账号文件仓储 owner，只持有可替换 FS，不保存跨命令账号状态。
#[derive(Clone)]
pub(crate) struct AccountsRepository {
    _fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl AccountsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { _fs: fs, paths }
    }

    pub(crate) fn source_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::AccountsSource)
    }
}
