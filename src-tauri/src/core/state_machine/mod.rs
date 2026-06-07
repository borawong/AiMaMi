// state_machine 模块只保留领域状态转换的边界。
// 状态事实、转移条件和并发保护语义需要证据补齐后再落地。

pub(crate) struct StateMachineBoundary;

pub(crate) trait StateMachinePort {}
