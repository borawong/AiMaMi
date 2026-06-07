// application 聚合用户动作、端口和服务边界，当前不装配真实流程。
// 这一层以后只组织仓储、平台和领域能力，不直接承载界面对象。

pub(crate) mod ports;
pub(crate) mod service;
pub(crate) mod usecase;

pub(crate) struct ApplicationLayerBoundary;
