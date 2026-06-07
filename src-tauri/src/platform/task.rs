// 任务文件只保留后台调度边界，不创建线程、任务或运行时。
pub(crate) struct TaskBoundary;

// 后续恢复调度能力时，需要明确取消、错误和返回路径。
pub(crate) trait TaskBoundaryPort {}
