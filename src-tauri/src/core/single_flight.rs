// 并发收敛文件只保留领域级并发语义边界，当前不实现运行保护。
// 操作去重、乱序和晚返回处理需要证据补齐后再落到这里。

pub(crate) struct OperationCoalescingBoundary;

pub(crate) trait OperationCoalescingPort {}
