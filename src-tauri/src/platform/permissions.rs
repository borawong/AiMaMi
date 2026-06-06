use crate::application::ports::PermissionsPort;
use crate::core::error::CoreError;

/// 中文职责说明：权限平台占位 adapter，当前只表达权限面板端口，不执行真实系统副作用。
#[derive(Default)]
pub(crate) struct NoopPermissions;

impl PermissionsPort for NoopPermissions {
    fn open_privacy_pane(&self, _pane: &str) -> Result<(), CoreError> {
        Ok(())
    }
}
