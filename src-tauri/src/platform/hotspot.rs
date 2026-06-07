use crate::application::ports::HotspotRuntimePort;
use crate::core::error::CoreError;

#[derive(Default)]
pub(crate) struct SystemHotspotRuntime;

impl HotspotRuntimePort for SystemHotspotRuntime {
    fn hotspot_ready(&self) -> Result<Option<bool>, CoreError> {
        Err(CoreError::platform(
            "hotspot_runtime_unsupported",
            "当前平台骨架尚未提供热点运行时检测能力。",
        ))
    }
}

#[derive(Default)]
pub(crate) struct NoopHotspotRuntime;

impl HotspotRuntimePort for NoopHotspotRuntime {
    fn hotspot_ready(&self) -> Result<Option<bool>, CoreError> {
        Ok(None)
    }
}
