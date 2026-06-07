// 这个文件只保留自定义指令仓储边界，不承载解析、读取或写入行为。

pub(crate) struct CustomInstructionsRepository;

pub(crate) trait CustomInstructionsRepositoryBoundary {}

impl CustomInstructionsRepositoryBoundary for CustomInstructionsRepository {}
