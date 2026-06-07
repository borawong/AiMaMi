// error 文件只保留领域错误语义的占位边界。
// 诊断编号、脱敏信息和跨层映射需要在合同稳定后再补齐。

pub(crate) struct ErrorBoundary;

pub(crate) trait ErrorSemanticPort {}
