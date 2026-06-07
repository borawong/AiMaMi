// 热区运行时文件只保留平台边界，不检测、不写入、不订阅系统状态。
pub(crate) struct HotspotRuntimeBoundary;

// 后续恢复热区能力时，只允许通过应用层端口接入。
pub(crate) trait HotspotRuntimeBoundaryPort {}
