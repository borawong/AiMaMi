use crate::repository::adapter::FileSystemAdapter;
use std::sync::Arc;

/// 中文职责说明：分析数据仓储 owner，只提供可重建路径和 FS 边界，不执行聚合算法。
#[derive(Clone)]
pub(crate) struct AnalyticsRepository {
    _fs: Arc<dyn FileSystemAdapter>,
}

impl AnalyticsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self { _fs: fs }
    }

    pub(crate) fn source_path(&self) -> String {
        String::new()
    }
}
