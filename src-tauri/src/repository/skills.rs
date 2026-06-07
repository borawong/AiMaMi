// 这个文件只保留技能仓储边界，技能目录和备份目录不在骨架阶段解析。

pub(crate) struct SkillsRepository;

pub(crate) trait SkillsRepositoryBoundary {}

impl SkillsRepositoryBoundary for SkillsRepository {}
