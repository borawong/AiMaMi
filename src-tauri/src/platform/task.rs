use std::thread;

/// 中文职责说明：平台后台任务入口，只负责脱离 IPC 返回路径的线程调度。
pub(crate) fn spawn_detached<F>(name: &'static str, task: F)
where
    F: FnOnce() + Send + 'static,
{
    let _ = thread::Builder::new().name(name.into()).spawn(task);
}
