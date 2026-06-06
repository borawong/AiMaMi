use crate::core::error::CoreError;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::path_guard::ensure_relative_path;
use std::path::Path;

pub(crate) struct RealFileSystem;

impl FileSystemAdapter for RealFileSystem {
    fn read_to_string(&self, path: &Path) -> Result<String, CoreError> {
        ensure_relative_path(path)?;
        std::fs::read_to_string(path).map_err(|error| {
            CoreError::repository("read_failed", "读取文件失败。")
                .with_diagnostic(error.to_string())
        })
    }

    fn write_string(&self, path: &Path, content: &str) -> Result<(), CoreError> {
        ensure_relative_path(path)?;
        std::fs::write(path, content).map_err(|error| {
            CoreError::repository("write_failed", "写入文件失败。")
                .with_diagnostic(error.to_string())
        })
    }

    fn exists(&self, path: &Path) -> bool {
        ensure_relative_path(path).is_ok() && path.exists()
    }
}
