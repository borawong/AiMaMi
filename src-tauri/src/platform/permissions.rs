// 权限文件只保留平台边界，不打开系统设置或读取本机权限状态。
pub(crate) struct PermissionsBoundary;

// 后续恢复权限能力时，需要由窄端口返回脱敏结果。
pub(crate) trait PermissionsBoundaryPort {}
