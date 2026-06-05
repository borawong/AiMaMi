use crate::repository::adapter::FileSystemAdapter;
use std::sync::Arc;

/// 中文职责说明：会话仓储 owner，只表达会话文件存储边界，真实解析后续补证据。
#[derive(Clone)]
pub(crate) struct SessionsRepository {
    _fs: Arc<dyn FileSystemAdapter>,
}

impl SessionsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self { _fs: fs }
    }

    pub(crate) fn source_path(&self) -> String {
        String::new()
    }
}
