// 这个文件只保留配置仓储边界，配置来源和错误语义等待证据补齐。

pub(crate) struct ConfigRepository;

pub(crate) trait ConfigRepositoryBoundary {}

impl ConfigRepositoryBoundary for ConfigRepository {}
