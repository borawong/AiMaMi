use crate::application::ports::ShellPort;
use crate::core::error::CoreError;

#[derive(Default)]
pub(crate) struct NoopShell;

impl ShellPort for NoopShell {
    fn open_path(&self, _path: &str) -> Result<(), CoreError> {
        Ok(())
    }
}
