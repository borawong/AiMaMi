// 托盘文件只保留桌面集成边界，不注册菜单、图标或通知。
pub(crate) struct TrayBoundary;

// 后续恢复托盘能力时，需要先补齐事件和 UI runtime 合同。
pub(crate) trait TrayBoundaryPort {}
