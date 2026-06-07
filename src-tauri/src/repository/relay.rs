// 这个文件只保留 relay 仓储边界，状态机和负载转换不在仓储骨架中实现。

pub(crate) struct RelayRepository;

pub(crate) trait RelayRepositoryBoundary {}

impl RelayRepositoryBoundary for RelayRepository {}
