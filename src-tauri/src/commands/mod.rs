// commands 聚合后端入口边界，当前只声明空骨架模块。
// 具体命令注册需要等待合同、用例和前端调用契约同时补齐。

pub(crate) mod accounts;
pub(crate) mod analytics;
pub(crate) mod custom_instructions;
pub(crate) mod hotspot;
pub(crate) mod mcp;
pub(crate) mod relay;
pub(crate) mod runtime_extensions;
pub(crate) mod sessions;
pub(crate) mod skills;
pub(crate) mod system;
pub(crate) mod voice;
