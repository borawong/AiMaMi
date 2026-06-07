// service 文件只保留应用服务装配边界，当前不聚合任何半实现。
// 后续服务对象只能组合端口和用例入口，不保存模块业务状态。

pub(crate) struct ApplicationServiceBoundary;

pub(crate) trait ApplicationServicePort {}
