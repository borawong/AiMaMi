// core 聚合领域模型、解析、迁移、状态转换和内部数据转换的边界。
// 当前只连接空骨架模块，不放可执行业务。

pub(crate) mod dto;
pub(crate) mod error;
pub(crate) mod migration;
pub(crate) mod model;
pub(crate) mod parser;
pub(crate) mod single_flight;
pub(crate) mod state_machine;
