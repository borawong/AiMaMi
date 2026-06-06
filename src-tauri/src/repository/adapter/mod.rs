pub(crate) mod fake_fs;
pub(crate) mod real_fs;
pub(crate) mod temp_fs;

use crate::core::error::CoreError;
use std::path::Path;

/// 中文职责说明：仓储层唯一文件系统端口，真实、临时和 fake FS 必须实现同一读写契约。
pub(crate) trait FileSystemAdapter: Send + Sync {
    fn read_to_string(&self, path: &Path) -> Result<String, CoreError>;
    fn write_string(&self, path: &Path, content: &str) -> Result<(), CoreError>;
    fn exists(&self, path: &Path) -> bool;
}
