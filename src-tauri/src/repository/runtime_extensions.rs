use crate::repository::adapter::FileSystemAdapter;
use std::sync::Arc;

/// 中文职责说明：运行时扩展仓储 owner，只封装插件配置路径和可替换 FS 边界。
#[derive(Clone)]
pub(crate) struct RuntimeExtensionsRepository {
    _fs: Arc<dyn FileSystemAdapter>,
}

impl RuntimeExtensionsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self { _fs: fs }
    }

    pub(crate) fn source_path(&self) -> String {
        String::new()
    }
}
