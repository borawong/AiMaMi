// 这个文件只保留真实文件系统适配器的命名边界，骨架阶段不触碰用户环境。

pub(crate) struct RealFileSystem;

pub(crate) trait RealFileSystemBoundary {}

impl RealFileSystemBoundary for RealFileSystem {}
