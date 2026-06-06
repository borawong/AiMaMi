# Rust core Claude 执行规则

## 渐进式覆盖

- 本文件是 Claude 在当前目录工作的独立执行合同；执行时以本文件文字为直接约束，不把 AGENTS.md 当作替代规则。
- 更深层 CLAUDE.md 可以收紧本目录规则，不能放宽证据门、匿名化、中文文档、前端 owner 边界和后端六边形边界。
- 本目录写入前必须确认两类硬门禁已经满足：前端 owner 只在入口、全局 Provider、路由表、route meta、runtime initializer、页面 shell、复杂模块、服务门面、TanStack cache、E2E mock 和 locale 指定层处理；后端 owner 只在 commands、application/usecase/service、core、platform、repository/adapter 和 contracts 指定层处理。
- 发生冲突时按“用户原始要求不可改写、raw/internal 证据优先于推测、同一主题最深层目录规则优先、更严格规则优先”的顺序处理。
- 本目录和下级目录禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。


## core 边界

- core 承载 domain model、解析、迁移、状态机、DTO 转换、错误语义、single-flight 和后台调度边界。
- core 不依赖 Tauri UI 对象，不直接解释平台窗口、托盘或系统权限行为。
- 跨模块事务必须以 usecase / service / repository 方法表达，命名描述业务动作。
- 阻塞 IO、tray rebuild、daemon runner 和外部进程操作必须有明确返回路径，不能卡住 IPC mutation response。
