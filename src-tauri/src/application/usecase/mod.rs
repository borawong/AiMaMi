// usecase 聚合用户动作级事务边界，当前只连接空骨架模块。
// 每个模块后续只表达一次动作的事务，不保存跨请求运行状态。

pub(crate) mod accounts;
pub(crate) mod analytics;
pub(crate) mod custom_instructions;
pub(crate) mod daemon;
pub(crate) mod mcp;
pub(crate) mod relay;
pub(crate) mod runtime_extensions;
pub(crate) mod sessions;
pub(crate) mod skills;
pub(crate) mod system;
pub(crate) mod voice;
