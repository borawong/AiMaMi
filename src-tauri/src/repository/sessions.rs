// 这个文件只保留会话仓储边界，会话记录转换需要等待 DTO 合同补证。

pub(crate) struct SessionsRepository;

pub(crate) trait SessionsRepositoryBoundary {}

impl SessionsRepositoryBoundary for SessionsRepository {}
