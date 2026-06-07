// 这个文件只保留注册表仓储边界，不保存跨命令业务状态。

pub(crate) struct RegistryRepository;

pub(crate) trait RegistryRepositoryBoundary {}

impl RegistryRepositoryBoundary for RegistryRepository {}
