# Rust 后端源码 Claude 执行规则

## 渐进式覆盖

- 本文件是 Claude 在当前目录工作的独立执行合同；执行时以本文件文字为直接约束，不把 AGENTS.md 当作替代规则。
- 更深层 CLAUDE.md 可以收紧本目录规则，不能放宽证据门、匿名化、中文文档、前端 owner 边界和后端六边形边界。
- 本目录写入前必须确认两类硬门禁已经满足：前端 owner 只在入口、全局 Provider、路由表、route meta、runtime initializer、页面 shell、复杂模块、服务门面、TanStack cache、E2E mock 和 locale 指定层处理；后端 owner 只在 commands、application/usecase/service、core、platform、repository/adapter 和 contracts 指定层处理。
- 发生冲突时按“用户原始要求不可改写、raw/internal 证据优先于推测、同一主题最深层目录规则优先、更严格规则优先”的顺序处理。
- 本目录和下级目录禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。


## 后端六边形边界

- 后端不做闭源业务全量还原是项目范围选择；必须按逆向内容打出真实六边形架构全骨架。
- commands 只做 IPC adapter：参数反序列化、获取/克隆 app state、调度 blocking task、调用 application/core、封装 CoreEnvelope。
- application/usecase owning 一次用户动作事务：校验输入、组织 repository/platform/core、提交结果。
- core owning domain model、解析、迁移、状态机、DTO 转换、错误语义和 single-flight；core 不依赖 Tauri UI 对象。
- platform 只封装 OS、进程、路径、权限、窗口、通知、shell/no-console、daemon/task/launchd 等能力。
- repository/adapter 集中文件系统读写和路径安全；真实 FS 与 fake/temp FS 必须可替换。
- 无 raw/internal 证据支撑的业务实现不得伪造成真实逻辑，只能保留中文职责注释、边界、接口、DTO、错误语义、测试占位和待补证据位置。
