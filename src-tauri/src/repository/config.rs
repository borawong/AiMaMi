use crate::repository::adapter::FileSystemAdapter;
use std::sync::Arc;

/// 中文职责说明：配置文件仓储 owner，只封装配置路径和 FS 边界，不解释产品状态机。
#[derive(Clone)]
pub(crate) struct ConfigRepository {
    _fs: Arc<dyn FileSystemAdapter>,
}

impl ConfigRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self { _fs: fs }
    }

    pub(crate) fn source_path(&self) -> String {
        String::new()
    }

    pub(crate) fn voice_source_path(&self) -> String {
        String::new()
    }
}
