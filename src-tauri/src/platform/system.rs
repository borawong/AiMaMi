// 系统信息文件只保留平台边界，不读取设备、主机名或操作系统细节。
pub(crate) struct SystemInfoBoundary;

// 后续恢复系统快照时，需要先定义脱敏字段和前端消费合同。
pub(crate) trait SystemInfoBoundaryPort {}
