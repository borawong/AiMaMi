use super::real_fs::RealFileSystem;
use super::{FileSystemAdapter, FileSystemEntry};
use crate::core::error::CoreError;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct TempFileSystem {
    pub root: PathBuf,
    inner: RealFileSystem,
}

impl TempFileSystem {
    pub fn new(label: &str) -> Self {
        let root = std::env::temp_dir().join(format!("open-aimami-{label}-{}", std::process::id()));
        Self {
            root,
            inner: RealFileSystem,
        }
    }
}

impl FileSystemAdapter for TempFileSystem {
    fn exists(&self, path: &Path) -> bool {
        self.inner.exists(path)
    }

    fn read_to_string(&self, path: &Path) -> Result<String, CoreError> {
        self.inner.read_to_string(path)
    }

    fn write_string(&self, path: &Path, content: &str) -> Result<(), CoreError> {
        self.inner.write_string(path, content)
    }

    fn create_dir_all(&self, path: &Path) -> Result<(), CoreError> {
        self.inner.create_dir_all(path)
    }

    fn remove_file(&self, path: &Path) -> Result<(), CoreError> {
        self.inner.remove_file(path)
    }

    fn remove_dir_all(&self, path: &Path) -> Result<(), CoreError> {
        self.inner.remove_dir_all(path)
    }

    fn copy_file(&self, from: &Path, to: &Path) -> Result<u64, CoreError> {
        self.inner.copy_file(from, to)
    }

    fn rename(&self, from: &Path, to: &Path) -> Result<(), CoreError> {
        self.inner.rename(from, to)
    }

    fn read_dir(&self, path: &Path) -> Result<Vec<FileSystemEntry>, CoreError> {
        self.inner.read_dir(path)
    }

    fn modified_unix_seconds(&self, path: &Path) -> Option<i64> {
        self.inner.modified_unix_seconds(path)
    }
}
