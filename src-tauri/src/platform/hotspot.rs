use crate::application::ports::HotspotRuntimePort;
use crate::core::error::CoreError;

/// 中文职责说明：热点运行时占位 adapter，仅表达平台只读端口，真实网络状态判断需补齐 raw/internal 证据。
#[derive(Default)]
pub(crate) struct NoopHotspotRuntime;

impl HotspotRuntimePort for NoopHotspotRuntime {
    fn hotspot_ready(&self) -> Result<Option<bool>, CoreError> {
        Ok(None)
    }
}
