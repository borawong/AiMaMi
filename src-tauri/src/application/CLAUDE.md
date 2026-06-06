# Rust application Claude 执行规则

## 渐进式覆盖

- 本文件是 Claude 在当前目录工作的独立执行合同；执行时以本文件文字为直接约束，不把 AGENTS.md 当作替代规则。
- 更深层 CLAUDE.md 可以收紧本目录规则，不能放宽证据门、匿名化、中文文档、前端 owner 边界和后端六边形边界。
- 本目录写入前必须确认两类硬门禁已经满足：前端 owner 只在入口、全局 Provider、路由表、route meta、runtime initializer、页面 shell、复杂模块、服务门面、TanStack cache、E2E mock 和 locale 指定层处理；后端 owner 只在 commands、application/usecase/service、core、platform、repository/adapter 和 contracts 指定层处理。
- 发生冲突时按“用户原始要求不可改写、raw/internal 证据优先于推测、同一主题最深层目录规则优先、更严格规则优先”的顺序处理。
- 本目录和下级目录禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。


## application 边界

- service.rs 只组合仓储、single-flight、平台端口和 usecase 入口。
- usecase/service owning 一个用户动作的一次事务：校验输入、读取 repository、调用 domain service/platform adapter、执行原子写入或后台调度、返回 DTO。
- application 不直接依赖 Tauri UI 对象，也不直接写真实文件系统。
- 未实现行为必须返回结构化 envelope，并说明后续 PR 可在当前边界内补齐。
