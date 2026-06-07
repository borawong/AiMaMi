pub(crate) mod fake_fs;
pub(crate) mod real_fs;
pub(crate) mod temp_fs;

use crate::core::error::CoreError;
use std::path::Path;

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct FileSystemEntry {
    pub path: std::path::PathBuf,
    pub file_name: String,
    pub is_directory: bool,
    pub modified_at: Option<i64>,
    pub created_at: Option<i64>,
}

pub(crate) trait FileSystemAdapter: Send + Sync {
    fn read_to_string(&self, path: &Path) -> Result<String, CoreError>;
    fn write_string(&self, path: &Path, content: &str) -> Result<(), CoreError>;
    fn exists(&self, path: &Path) -> bool;
    fn list_directory(&self, path: &Path) -> Result<Vec<FileSystemEntry>, CoreError>;
}
