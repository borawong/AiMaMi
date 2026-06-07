// daemon 用例文件只保留一次用户动作的事务边界，当前不写可执行流程。
// 输入校验、仓储协作和平台能力调用需要证据补齐后再落到这里。

pub(crate) struct DaemonUseCaseBoundary;

pub(crate) trait DaemonUseCaseBoundaryPort {}
