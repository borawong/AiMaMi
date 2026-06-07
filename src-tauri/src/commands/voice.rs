// voice 命令层当前只保留模块边界，未纳入公开还原范围的能力不注册 IPC 入口。
pub(crate) struct VoiceCommandBoundary;

// 后续若补齐证据，应由本层只做参数接收和用例调度，不在这里写业务流程。
pub(crate) trait VoiceCommandPort {}

impl VoiceCommandPort for VoiceCommandBoundary {}
