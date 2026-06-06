use crate::application::ports::HotspotRuntimePort;
use crate::core::error::CoreError;

#[derive(Default)]
pub(crate) struct NoopHotspotRuntime;

impl HotspotRuntimePort for NoopHotspotRuntime {
    fn hotspot_ready(&self) -> Result<Option<bool>, CoreError> {
        Ok(None)
    }
}
