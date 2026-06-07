// analytics 命令文件只保留后端入口边界，当前不注册可调用命令。
// 这一层以后只接收参数、取得应用状态并把请求转交给用例层。

pub(crate) struct AnalyticsCommandBoundary;

pub(crate) trait AnalyticsCommandBoundaryPort {}
