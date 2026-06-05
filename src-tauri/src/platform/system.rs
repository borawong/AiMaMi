use crate::application::ports::{PlatformInfoSnapshot, SystemInfoPort};

/// 中文职责说明：当前运行平台信息 adapter，只返回结构化且不含用户路径的系统快照。
pub(crate) struct CurrentSystem;

impl SystemInfoPort for CurrentSystem {
    fn system_info(&self) -> PlatformInfoSnapshot {
        PlatformInfoSnapshot {
            os: std::env::consts::OS.into(),
            os_version: String::new(),
            arch: std::env::consts::ARCH.into(),
            hostname: String::new(),
        }
    }
}
