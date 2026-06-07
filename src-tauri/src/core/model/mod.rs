// model 模块只保留领域模型和值对象的边界。
// 当前没有证据支撑的业务字段不写入模型。

pub(crate) struct DomainModelBoundary;

pub(crate) trait DomainModelPort {}
