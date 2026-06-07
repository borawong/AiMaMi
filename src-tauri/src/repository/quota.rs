// 这个文件只保留配额仓储边界，历史记录来源和聚合规则等待证据补齐。

pub(crate) struct QuotaRepository;

pub(crate) trait QuotaRepositoryBoundary {}

impl QuotaRepositoryBoundary for QuotaRepository {}
