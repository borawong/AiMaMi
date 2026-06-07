// ports 文件保留应用层对外部能力的窄接口位置。
// 仓储和平台能力需要先形成可替换契约，再由用例通过这里协作。

pub(crate) trait RepositoryPort {}

pub(crate) trait PlatformPort {}
