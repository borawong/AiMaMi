// shell 文件只保留平台边界，不打开本机路径或调用系统程序。
pub(crate) struct ShellBoundary;

// 后续恢复路径打开能力时，需要先经过脱敏路径合同。
pub(crate) trait ShellBoundaryPort {}
