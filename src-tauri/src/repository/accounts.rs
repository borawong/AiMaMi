use crate::repository::adapter::FileSystemAdapter;
use std::sync::Arc;

/// 中文职责说明：账号文件仓储 owner，只持有可替换 FS，不保存跨命令账号状态。
#[derive(Clone)]
pub(crate) struct AccountsRepository {
    _fs: Arc<dyn FileSystemAdapter>,
}

impl AccountsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self { _fs: fs }
    }

    pub(crate) fn source_path(&self) -> String {
        String::new()
    }
}
