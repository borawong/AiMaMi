// 这个文件只保留仓储位置边界，不解析、不拼接、不规范化任何真实路径。

pub(crate) struct RepositoryLocations;

pub(crate) trait RepositoryLocationsBoundary {}

impl RepositoryLocationsBoundary for RepositoryLocations {}
