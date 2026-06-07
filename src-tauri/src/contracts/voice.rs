// voice 合同层当前只保留跨层类型边界，尚无可信 DTO 可以对外承诺。
pub(crate) struct VoiceContractBoundary;

// 该占位类型仅用于标记 voice 合同文件仍存在，不表达任何业务数据。
pub(crate) type VoiceContractPlaceholder = ();
