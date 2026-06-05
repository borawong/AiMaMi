use crate::core::error::CoreError;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::path_guard::ensure_relative_path;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// 中文职责说明：内存 fake FS，用于验证仓储契约，禁止触碰真实用户环境。
#[derive(Default)]
pub(crate) struct FakeFileSystem {
    files: Mutex<HashMap<PathBuf, String>>,
}

impl FileSystemAdapter for FakeFileSystem {
    fn read_to_string(&self, path: &Path) -> Result<String, CoreError> {
        ensure_relative_path(path)?;
        let files = self
            .files
            .lock()
            .map_err(|_| CoreError::repository("fake_fs_lock", "测试文件系统不可用。"))?;
        files
            .get(path)
            .cloned()
            .ok_or_else(|| CoreError::repository("not_found", "文件不存在。"))
    }

    fn write_string(&self, path: &Path, content: &str) -> Result<(), CoreError> {
        ensure_relative_path(path)?;
        let mut files = self
            .files
            .lock()
            .map_err(|_| CoreError::repository("fake_fs_lock", "测试文件系统不可用。"))?;
        files.insert(path.to_path_buf(), content.to_owned());
        Ok(())
    }

    fn exists(&self, path: &Path) -> bool {
        if ensure_relative_path(path).is_err() {
            return false;
        }
        self.files
            .lock()
            .map(|files| files.contains_key(path))
            .unwrap_or(false)
    }
}
