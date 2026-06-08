use super::{FileSystemAdapter, FileSystemEntry};
use crate::core::error::CoreError;
use std::path::Path;

#[derive(Debug, Clone, Default)]
pub struct RealFileSystem;

impl FileSystemAdapter for RealFileSystem {
    fn exists(&self, path: &Path) -> bool {
        path.exists()
    }

    fn read_to_string(&self, path: &Path) -> Result<String, CoreError> {
        Ok(std::fs::read_to_string(path)?)
    }

    fn write_string(&self, path: &Path, content: &str) -> Result<(), CoreError> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        Ok(std::fs::write(path, content)?)
    }

    fn create_dir_all(&self, path: &Path) -> Result<(), CoreError> {
        Ok(std::fs::create_dir_all(path)?)
    }

    fn remove_file(&self, path: &Path) -> Result<(), CoreError> {
        if path.exists() {
            std::fs::remove_file(path)?;
        }
        Ok(())
    }

    fn remove_dir_all(&self, path: &Path) -> Result<(), CoreError> {
        if path.exists() {
            std::fs::remove_dir_all(path)?;
        }
        Ok(())
    }

    fn copy_file(&self, from: &Path, to: &Path) -> Result<u64, CoreError> {
        if let Some(parent) = to.parent() {
            std::fs::create_dir_all(parent)?;
        }
        Ok(std::fs::copy(from, to)?)
    }

    fn rename(&self, from: &Path, to: &Path) -> Result<(), CoreError> {
        if let Some(parent) = to.parent() {
            std::fs::create_dir_all(parent)?;
        }
        Ok(std::fs::rename(from, to)?)
    }

    fn read_dir(&self, path: &Path) -> Result<Vec<FileSystemEntry>, CoreError> {
        if !path.exists() {
            return Ok(Vec::new());
        }

        let mut entries = Vec::new();
        for entry in std::fs::read_dir(path)? {
            let entry = entry?;
            let path = entry.path();
            entries.push(FileSystemEntry {
                is_dir: path.is_dir(),
                path,
            });
        }
        Ok(entries)
    }

    fn modified_unix_seconds(&self, path: &Path) -> Option<i64> {
        std::fs::metadata(path)
            .ok()
            .and_then(|metadata| metadata.modified().ok())
            .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs() as i64)
    }
}
