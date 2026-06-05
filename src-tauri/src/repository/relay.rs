use crate::repository::adapter::FileSystemAdapter;
use std::sync::Arc;

/// 中文职责说明：Relay 配置仓储 owner，只封装配置文件边界，不执行代理启停。
#[derive(Clone)]
pub(crate) struct RelayRepository {
    _fs: Arc<dyn FileSystemAdapter>,
}

impl RelayRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self { _fs: fs }
    }

    pub(crate) fn source_path(&self) -> String {
        String::new()
    }
}
