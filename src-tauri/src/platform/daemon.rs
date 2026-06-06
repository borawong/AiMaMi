use crate::core::error::CoreError;

pub(crate) trait DaemonRunner {
    fn request_run_once(&self) -> Result<(), CoreError>;
}

pub(crate) struct NoopDaemonRunner;

impl DaemonRunner for NoopDaemonRunner {
    fn request_run_once(&self) -> Result<(), CoreError> {
        Ok(())
    }
}
