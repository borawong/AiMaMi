use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use std::sync::Arc;

/// 中文职责说明：技能仓储 owner，只封装安装和备份路径，不直接执行业务导入删除。
#[derive(Clone)]
pub(crate) struct SkillsRepository {
    _fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl SkillsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { _fs: fs, paths }
    }

    pub(crate) fn root_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::SkillsRoot)
    }

    pub(crate) fn backup_root_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::SkillBackupsRoot)
    }
}
