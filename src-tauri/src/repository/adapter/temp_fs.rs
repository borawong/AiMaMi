use crate::core::error::CoreError;
use crate::repository::adapter::{FileSystemAdapter, FileSystemEntry};
use crate::repository::path_guard::ensure_relative_path;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

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

    fn list_directory(&self, path: &Path) -> Result<Vec<FileSystemEntry>, CoreError> {
        let resolved = self.resolve_checked(path)?;
        if !resolved.exists() {
            return Ok(Vec::new());
        }
        if !resolved.is_dir() {
            return Err(CoreError::repository(
                "temp_not_directory",
                "临时仓储路径不是目录。",
            ));
        }

        let mut entries = Vec::new();
        for entry in std::fs::read_dir(resolved).map_err(|error| {
            CoreError::repository("temp_list_directory_failed", "列举临时目录失败。")
                .with_diagnostic(error.to_string())
        })? {
            let entry = entry.map_err(|error| {
                CoreError::repository("temp_list_directory_entry_failed", "读取临时目录项失败。")
                    .with_diagnostic(error.to_string())
            })?;
            let metadata = entry.metadata().map_err(|error| {
                CoreError::repository(
                    "temp_directory_entry_metadata_failed",
                    "读取临时目录项元数据失败。",
                )
                .with_diagnostic(error.to_string())
            })?;
            let relative_path = path.join(entry.file_name());
            entries.push(FileSystemEntry {
                path: relative_path,
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
