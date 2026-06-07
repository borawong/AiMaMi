pub(crate) mod fake_fs;
pub(crate) mod real_fs;
pub(crate) mod temp_fs;

// 这个文件只保留仓储适配器边界，骨架阶段不声明读取、写入或枚举目录的行为。
pub(crate) struct FileSystemEntry;

pub(crate) trait FileSystemAdapter {}
