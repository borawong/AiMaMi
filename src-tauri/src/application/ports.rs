use crate::core::error::CoreError;

pub(crate) trait WindowPort: Send + Sync {
    fn focus_main_window(&self) -> Result<(), CoreError>;
}

pub(crate) trait ShellPort {
    fn open_path(&self, path: &str) -> Result<(), CoreError>;
}

pub(crate) trait ProcessPort {
    fn restart_application(&self) -> Result<(), CoreError>;
    fn graceful_restart_for_update(&self) -> Result<(), CoreError>;
}

pub(crate) trait PermissionsPort {
    fn open_privacy_pane(&self, pane: &str) -> Result<(), CoreError>;
}

pub(crate) struct PlatformInfoSnapshot {
    pub(crate) os: String,
    pub(crate) os_version: String,
    pub(crate) arch: String,
    pub(crate) hostname: String,
}

pub(crate) trait SystemInfoPort {
    fn system_info(&self) -> PlatformInfoSnapshot;
}

pub(crate) trait HotspotRuntimePort {
    fn hotspot_ready(&self) -> Result<Option<bool>, CoreError>;
}
