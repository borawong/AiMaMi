// 这个文件只保留临时文件系统适配器的命名边界，当前不创建也不清理临时内容。

pub(crate) struct TempFileSystem;

pub(crate) trait TempFileSystemBoundary {}

impl TempFileSystemBoundary for TempFileSystem {}
