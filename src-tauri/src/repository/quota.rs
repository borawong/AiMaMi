use crate::repository::adapter::FileSystemAdapter;
use std::sync::Arc;

/// 中文职责说明：配额历史仓储 owner，只表达存储边界，真实解析和聚合后续补证据。
#[derive(Clone)]
pub(crate) struct QuotaRepository {
    _fs: Arc<dyn FileSystemAdapter>,
}

impl QuotaRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self { _fs: fs }
    }
}
