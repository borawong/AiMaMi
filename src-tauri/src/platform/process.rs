use crate::application::ports::ProcessPort;
use crate::core::error::CoreError;

#[derive(Default)]
pub(crate) struct SystemProcess;

impl ProcessPort for SystemProcess {
    fn restart_application(&self) -> Result<(), CoreError> {
        Err(unsupported_process("restart_application"))
    }

    fn graceful_restart_for_update(&self) -> Result<(), CoreError> {
        Err(unsupported_process("graceful_restart_for_update"))
    }
}

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

fn unsupported_process(action: &'static str) -> CoreError {
    CoreError::platform("process_unsupported", "当前平台骨架尚未提供进程控制能力。")
        .with_diagnostic(action)
}
