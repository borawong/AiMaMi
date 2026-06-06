use crate::application::ports::{PlatformInfoSnapshot, SystemInfoPort};

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
