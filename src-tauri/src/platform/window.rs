// 窗口文件只保留平台边界，不持有窗口句柄或控制桌面窗口。
pub(crate) struct WindowBoundary;

// 后续恢复窗口能力时，需要由应用层端口表达可替换行为。
pub(crate) trait WindowBoundaryPort {}
