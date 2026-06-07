pub(crate) mod accounts;
pub(crate) mod adapter;
pub(crate) mod analytics;
pub(crate) mod config;
pub(crate) mod custom_instructions;
pub(crate) mod mcp;
pub(crate) mod path_guard;
pub(crate) mod paths;
pub(crate) mod quota;
pub(crate) mod registry;
pub(crate) mod relay;
pub(crate) mod runtime_extensions;
pub(crate) mod sessions;
pub(crate) mod skills;
pub(crate) mod voice;

// 这个文件只保留仓储层的六边形入口，当前不装配任何持久化能力。
pub(crate) struct RepositoryBoundary;

// 仓储合同恢复前，不在聚合入口保存模块状态或路径上下文。
pub(crate) trait RepositoryBoundaryPort {}
