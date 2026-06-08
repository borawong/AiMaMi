pub mod accounts;
pub mod adapter;
pub mod analytics;
pub mod config;
pub mod custom_instructions;
pub mod mcp;
pub mod path_guard;
pub mod paths;
pub mod quota;
pub mod registry;
pub mod relay;
pub mod runtime_extensions;
pub mod sessions;
pub mod skills;
pub mod voice;

use adapter::real_fs::RealFileSystem;
use paths::RepositoryPaths;

#[derive(Debug, Clone)]
pub struct Repository {
    paths: RepositoryPaths,
    fs: RealFileSystem,
}

impl Repository {
    pub fn new() -> Self {
        Self {
            paths: RepositoryPaths::new(),
            fs: RealFileSystem,
        }
    }

    pub fn paths(&self) -> &RepositoryPaths {
        &self.paths
    }

    pub fn fs(&self) -> &RealFileSystem {
        &self.fs
    }
}

impl Default for Repository {
    fn default() -> Self {
        Self::new()
    }
}
