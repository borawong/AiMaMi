use std::thread;

pub(crate) fn spawn_detached<F>(name: &'static str, task: F)
where
    F: FnOnce() + Send + 'static,
{
    let _ = thread::Builder::new().name(name.into()).spawn(task);
}
