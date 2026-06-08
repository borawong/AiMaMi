use super::{FileSystemAdapter, FileSystemEntry};
use crate::core::error::CoreError;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Default)]
pub struct FakeFileSystem {
    files: HashMap<PathBuf, String>,
}

impl FakeFileSystem {
    pub fn with_file(mut self, path: PathBuf, content: String) -> Self {
        self.files.insert(path, content);
        self
    }
}

impl FileSystemAdapter for FakeFileSystem {
    fn exists(&self, path: &Path) -> bool {
        self.files.contains_key(path) || self.files.keys().any(|item| item.starts_with(path))
    }

    fn read_to_string(&self, path: &Path) -> Result<String, CoreError> {
        self.files
            .get(path)
            .cloned()
            .ok_or_else(|| CoreError::NotFound(path.display().to_string()))
    }

    fn write_string(&self, _path: &Path, _content: &str) -> Result<(), CoreError> {
        Err(CoreError::Unsupported("测试替身默认不写入".to_string()))
    }

    fn create_dir_all(&self, _path: &Path) -> Result<(), CoreError> {
        Ok(())
    }

    fn remove_file(&self, _path: &Path) -> Result<(), CoreError> {
        Ok(())
    }

    fn remove_dir_all(&self, _path: &Path) -> Result<(), CoreError> {
        Ok(())
    }

    fn copy_file(&self, _from: &Path, _to: &Path) -> Result<u64, CoreError> {
        Err(CoreError::Unsupported("测试替身默认不复制".to_string()))
    }

    fn rename(&self, _from: &Path, _to: &Path) -> Result<(), CoreError> {
        Err(CoreError::Unsupported("测试替身默认不重命名".to_string()))
    }

    fn read_dir(&self, path: &Path) -> Result<Vec<FileSystemEntry>, CoreError> {
        let mut entries = Vec::new();
        for item in self.files.keys().filter(|item| item.starts_with(path)) {
            entries.push(FileSystemEntry {
                path: item.clone(),
                is_dir: false,
            });
        }
        Ok(entries)
    }

    fn modified_unix_seconds(&self, _path: &Path) -> Option<i64> {
        Some(0)
    }
}
