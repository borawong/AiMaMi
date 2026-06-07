// 后台运行器文件只保留平台端口边界，不触发系统动作或返回伪成功。
pub(crate) struct DaemonRunnerBoundary;

// 后续恢复后台执行时，需要先补齐端口合同和可替换平台适配。
pub(crate) trait DaemonRunnerPort {}
