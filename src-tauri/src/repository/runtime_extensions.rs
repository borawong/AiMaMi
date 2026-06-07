// 这个文件只保留运行时扩展仓储边界，插件清单读取和解析暂不落地。

pub(crate) struct RuntimeExtensionsRepository;

pub(crate) trait RuntimeExtensionsRepositoryBoundary {}

impl RuntimeExtensionsRepositoryBoundary for RuntimeExtensionsRepository {}
