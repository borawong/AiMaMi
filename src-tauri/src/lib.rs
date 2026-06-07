mod adapters;
mod application;
mod commands;
mod contracts;
mod core;
mod platform;
mod repository;

// 库入口只保留后端六边形装配边界，当前不启动运行时或注册命令。
// 后续入口恢复必须通过 commands、application、core、platform 和 repository 的边界协作。
pub struct BackendLibraryBoundary;
