use crate::application::ports::ShellPort;
use crate::core::error::CoreError;

/// 中文职责说明：Shell 平台占位 adapter，当前只表达打开路径端口，不执行真实系统副作用。
#[derive(Default)]
pub(crate) struct NoopShell;

impl ShellPort for NoopShell {
    fn open_path(&self, _path: &str) -> Result<(), CoreError> {
        Ok(())
    }
}
