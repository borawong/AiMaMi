use crate::core::error::CoreError;

/// 中文职责说明：窗口平台端口，usecase 只依赖本接口，不直接接触 Tauri 窗口对象。
pub(crate) trait WindowPort: Send + Sync {
    fn focus_main_window(&self) -> Result<(), CoreError>;
}

/// 中文职责说明：系统 shell 能力端口，真实打开路径的副作用只能由 platform adapter 实现。
pub(crate) trait ShellPort {
    fn open_path(&self, path: &str) -> Result<(), CoreError>;
}

/// 中文职责说明：进程生命周期端口，重启和退出调度不进入 command 或 repository。
pub(crate) trait ProcessPort {
    fn restart_application(&self) -> Result<(), CoreError>;
    fn graceful_restart_for_update(&self) -> Result<(), CoreError>;
}

/// 中文职责说明：平台权限入口，权限面板等 OS 能力只能通过 platform adapter 暴露。
pub(crate) trait PermissionsPort {
    fn open_privacy_pane(&self, pane: &str) -> Result<(), CoreError>;
}

/// 中文职责说明：平台信息快照 DTO，只承载脱敏后的系统能力结果。
pub(crate) struct PlatformInfoSnapshot {
    pub(crate) os: String,
    pub(crate) os_version: String,
    pub(crate) arch: String,
    pub(crate) hostname: String,
}

/// 中文职责说明：系统信息端口，application 层通过该端口读取平台快照。
pub(crate) trait SystemInfoPort {
    fn system_info(&self) -> PlatformInfoSnapshot;
}
