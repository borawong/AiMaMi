use crate::core::error::CoreError;
use crate::repository::adapter::{FileSystemAdapter, FileSystemEntry};
use crate::repository::path_guard::ensure_relative_path;
use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

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
            .map(|files| {
                files.contains_key(path) || files.keys().any(|file| file.starts_with(path))
            })
            .unwrap_or(false)
    }

    fn list_directory(&self, path: &Path) -> Result<Vec<FileSystemEntry>, CoreError> {
        ensure_relative_path(path)?;
        let files = self
            .files
            .lock()
            .map_err(|_| CoreError::repository("fake_fs_lock", "测试文件系统不可用。"))?;
        let mut children = BTreeMap::<String, FileSystemEntry>::new();

        for file in files.keys() {
            let Ok(relative) = file.strip_prefix(path) else {
                continue;
            };
            let mut components = relative.components();
            let Some(component) = components.next() else {
                continue;
            };
            let name = component.as_os_str().to_string_lossy().into_owned();
            let child_path = path.join(&name);
            let is_directory = components.next().is_some();
            children
                .entry(name.clone())
                .and_modify(|entry| entry.is_directory |= is_directory)
                .or_insert_with(|| FileSystemEntry {
                    path: child_path,
                    file_name: name,
                    is_directory,
                    modified_at: None,
                    created_at: None,
                });
        }

        Ok(children.into_values().collect())
    }
}
