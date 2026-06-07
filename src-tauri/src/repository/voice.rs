// 这个文件只保留 voice 仓储边界，录音、快捷键和运行时负载均不在仓储层实现。

pub(crate) struct VoiceRepository;

pub(crate) trait VoiceRepositoryBoundary {}

impl VoiceRepositoryBoundary for VoiceRepository {}
