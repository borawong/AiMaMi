use crate::application::ports::PermissionsPort;
use crate::core::error::CoreError;

#[derive(Default)]
pub(crate) struct NoopPermissions;

impl PermissionsPort for NoopPermissions {
    fn open_privacy_pane(&self, _pane: &str) -> Result<(), CoreError> {
        Ok(())
    }
}
