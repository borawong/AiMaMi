// dto 模块只保留领域内部数据转换边界。
// 这里不是对外合同，字段需要由领域证据或明确占位来驱动。

pub(crate) mod backend_skeleton;

pub(crate) struct CoreDtoBoundary;
