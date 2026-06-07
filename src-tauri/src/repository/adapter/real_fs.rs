use crate::core::error::CoreError;
use crate::repository::adapter::{FileSystemAdapter, FileSystemEntry};
use crate::repository::path_guard::ensure_relative_path;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

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

    fn list_directory(&self, path: &Path) -> Result<Vec<FileSystemEntry>, CoreError> {
        ensure_relative_path(path)?;
        if !path.exists() {
            return Ok(Vec::new());
        }
        if !path.is_dir() {
            return Err(CoreError::repository("not_directory", "仓储路径不是目录。"));
        }

        let mut entries = Vec::new();
        for entry in std::fs::read_dir(path).map_err(|error| {
            CoreError::repository("list_directory_failed", "列举目录失败。")
                .with_diagnostic(error.to_string())
        })? {
            let entry = entry.map_err(|error| {
                CoreError::repository("list_directory_entry_failed", "读取目录项失败。")
                    .with_diagnostic(error.to_string())
            })?;
            let metadata = entry.metadata().map_err(|error| {
                CoreError::repository("directory_entry_metadata_failed", "读取目录项元数据失败。")
                    .with_diagnostic(error.to_string())
            })?;
            entries.push(FileSystemEntry {
                path: entry.path(),
                file_name: entry.file_name().to_string_lossy().into_owned(),
                is_directory: metadata.is_dir(),
                modified_at: metadata.modified().ok().and_then(system_time_to_unix),
                created_at: metadata.created().ok().and_then(system_time_to_unix),
            });
        }
        entries.sort_by(|left, right| left.file_name.cmp(&right.file_name));
        Ok(entries)
    }
}

fn system_time_to_unix(time: SystemTime) -> Option<i64> {
    time.duration_since(UNIX_EPOCH)
        .ok()
        .and_then(|duration| i64::try_from(duration.as_secs()).ok())
}
