use crate::repository::adapter::FileSystemAdapter;
use std::sync::Arc;

/// 中文职责说明：自定义指令仓储 owner，只封装模板文件路径和可替换 FS 边界。
#[derive(Clone)]
pub(crate) struct CustomInstructionsRepository {
    _fs: Arc<dyn FileSystemAdapter>,
}

impl CustomInstructionsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>) -> Self {
        Self { _fs: fs }
    }

    pub(crate) fn source_path(&self) -> String {
        String::new()
    }
}
