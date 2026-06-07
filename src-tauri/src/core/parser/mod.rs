// parser 模块只保留解析和语义归一的边界。
// 输入格式、失败分类和脱敏结果需要在证据补齐后再实现。

pub(crate) struct ParserBoundary;

pub(crate) trait ParserPort {}
