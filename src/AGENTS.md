# src 前端源码 Agent 执行规则

## 渐进式覆盖

- 本文件是当前目录的直接执行合同；更深层同名规则可以收紧本目录规则，不能放宽证据门、匿名化、中文文档、前端 owner 边界和后端六边形边界。
- 本目录写入前必须确认两类硬门禁已经满足：前端 owner 只在入口、全局 Provider、路由表、route meta、runtime initializer、页面 shell、复杂模块、服务门面、TanStack cache、E2E mock 和 locale 指定层处理；后端 owner 只在 commands、application/usecase/service、core、platform、repository/adapter 和 contracts 指定层处理。
- 发生冲突时按“用户原始要求不可改写、raw/internal 证据优先于推测、同一主题最深层目录规则优先、更严格规则优先”的顺序处理。
- 本目录和下级目录禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。


## 前端全局边界

- 前端按目标主流模块化架构组织；仓库内不得出现外部参考仓库名称。
- entry/root 只装配全局 Provider、Router、错误边界、runtime initializer 和 prompt host。
- route registry 是路由、布局、错误边界、标题、图标、可见性、预加载、骨架和高 IO 反馈的唯一 owner。
- runtime initializer 只负责事件订阅、bootstrap seed、cache 写入和模块 action 调度，不拥有弹窗、toast 文案或业务列表状态。
- 页面文件只能作为 route/module shell，业务流程、数据请求、弹窗状态机和列表操作必须下沉到模块 owner。
- TanStack cache 是后端事实唯一前端 SOT；组件 state 只保存选择、草稿、hover/focus、弹窗开关等短生命周期 UI 状态。
- 用户可见文案必须进入 src/locales/zh.json 和 src/locales/en.json；测试断言也应通过 locale helper 或 locale JSON。
- 无仓库内 raw/internal 证据支撑的业务逻辑不得伪造成完整实现，只能保留中文职责注释、边界类型、空导出、待补证据位置或未实现状态。
