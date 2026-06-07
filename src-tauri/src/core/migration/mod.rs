// migration 模块只保留领域迁移规则的边界。
// 版本状态和转换路径需要由仓储可重建状态驱动后再实现。

pub(crate) struct MigrationBoundary;

pub(crate) trait MigrationPort {}
