// 进程文件只保留平台边界，不启动、重启或探测外部程序。
pub(crate) struct ProcessBoundary;

// 后续恢复进程能力时，需要先补齐可替换适配器合同。
pub(crate) trait ProcessBoundaryPort {}
