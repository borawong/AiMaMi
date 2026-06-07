// 这个文件只保留账号仓储边界，后续实现必须先补充仓库内证据和契约。

pub(crate) struct AccountsRepository;

pub(crate) trait AccountsRepositoryBoundary {}

impl AccountsRepositoryBoundary for AccountsRepository {}
