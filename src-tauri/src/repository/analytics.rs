// 这个文件只保留分析数据仓储边界，当前骨架不读取任何本地内容。

pub(crate) struct AnalyticsRepository;

pub(crate) trait AnalyticsRepositoryBoundary {}

impl AnalyticsRepositoryBoundary for AnalyticsRepository {}
