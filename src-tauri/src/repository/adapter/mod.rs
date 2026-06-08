pub mod fake_fs;
pub mod real_fs;
pub mod temp_fs;

use crate::core::error::CoreError;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FileSystemEntry {
    pub path: PathBuf,
    pub is_dir: bool,
}

pub trait FileSystemAdapter {
    fn exists(&self, path: &Path) -> bool;
    fn read_to_string(&self, path: &Path) -> Result<String, CoreError>;
    fn write_string(&self, path: &Path, content: &str) -> Result<(), CoreError>;
    fn create_dir_all(&self, path: &Path) -> Result<(), CoreError>;
    fn remove_file(&self, path: &Path) -> Result<(), CoreError>;
    fn remove_dir_all(&self, path: &Path) -> Result<(), CoreError>;
    fn copy_file(&self, from: &Path, to: &Path) -> Result<u64, CoreError>;
    fn rename(&self, from: &Path, to: &Path) -> Result<(), CoreError>;
    fn read_dir(&self, path: &Path) -> Result<Vec<FileSystemEntry>, CoreError>;
    fn modified_unix_seconds(&self, path: &Path) -> Option<i64>;
}
