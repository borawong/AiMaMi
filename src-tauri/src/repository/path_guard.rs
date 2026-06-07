// 这个文件只保留路径安全边界，真实校验规则需要由 repository 合同重新声明。

pub(crate) struct PathGuard;

pub(crate) trait PathGuardBoundary {}

impl PathGuardBoundary for PathGuard {}
