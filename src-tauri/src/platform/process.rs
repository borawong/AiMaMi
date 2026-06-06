use crate::application::ports::ProcessPort;
use crate::core::error::CoreError;

#[derive(Default)]
pub(crate) struct NoopProcess;

impl ProcessPort for NoopProcess {
    fn restart_application(&self) -> Result<(), CoreError> {
        Ok(())
    }

    fn graceful_restart_for_update(&self) -> Result<(), CoreError> {
        Ok(())
    }
}
