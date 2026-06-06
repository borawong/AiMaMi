use crate::application::ports::ProcessPort;
use crate::core::error::CoreError;

/// 中文职责说明：进程平台占位 adapter，当前只表达端口边界，不执行真实重启副作用。
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
