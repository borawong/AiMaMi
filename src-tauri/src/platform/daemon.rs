use crate::core::error::CoreError;

/// 中文职责说明：守护进程平台端口，只表达后台运行请求，不保存业务状态。
pub(crate) trait DaemonRunner {
    fn request_run_once(&self) -> Result<(), CoreError>;
}

/// 中文职责说明：守护进程占位 adapter，当前不启动真实后台进程。
pub(crate) struct NoopDaemonRunner;

impl DaemonRunner for NoopDaemonRunner {
    fn request_run_once(&self) -> Result<(), CoreError> {
        Ok(())
    }
}
