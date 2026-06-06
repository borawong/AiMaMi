use crate::core::error::CoreError;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::path_guard::ensure_relative_path;
use std::path::{Path, PathBuf};

/// 中文职责说明：临时根目录 FS adapter，用真实磁盘验证契约但隔离到调用方提供的临时根。
pub(crate) struct TempFileSystem {
    root: PathBuf,
}

impl TempFileSystem {
    pub(crate) fn new(root: PathBuf) -> Self {
        Self { root }
    }

    fn resolve_checked(&self, path: &Path) -> Result<PathBuf, CoreError> {
        ensure_relative_path(path)?;
        Ok(self.root.join(path))
    }
}

impl FileSystemAdapter for TempFileSystem {
    fn read_to_string(&self, path: &Path) -> Result<String, CoreError> {
        std::fs::read_to_string(self.resolve_checked(path)?).map_err(|error| {
            CoreError::repository("temp_read_failed", "读取临时文件失败。")
                .with_diagnostic(error.to_string())
        })
    }

    fn write_string(&self, path: &Path, content: &str) -> Result<(), CoreError> {
        std::fs::write(self.resolve_checked(path)?, content).map_err(|error| {
            CoreError::repository("temp_write_failed", "写入临时文件失败。")
                .with_diagnostic(error.to_string())
        })
    }

    fn exists(&self, path: &Path) -> bool {
        self.resolve_checked(path)
            .map(|resolved| resolved.exists())
            .unwrap_or(false)
    }
}
