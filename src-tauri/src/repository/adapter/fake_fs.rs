// 这个文件只保留测试替身的命名边界，当前不模拟任何文件系统行为。

pub(crate) struct FakeFileSystem;

pub(crate) trait FakeFileSystemBoundary {}

impl FakeFileSystemBoundary for FakeFileSystem {}
