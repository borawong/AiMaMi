// voice 用例层当前只保留用户动作事务边界，未授权能力不写成可执行流程。
pub(crate) struct VoiceUseCase;

// 这里不保存仓库、平台或运行时状态，避免占位内容被误认为后端行为。
pub(crate) trait VoiceUseCaseBoundary {}

impl VoiceUseCaseBoundary for VoiceUseCase {}
