# accounts 路由目录 Claude 执行规则

## 渐进式覆盖

- 本文件是 Claude 在当前目录工作的独立执行合同；执行时以本文件文字为直接约束，不把 AGENTS.md 当作替代规则。
- 更深层 CLAUDE.md 可以收紧本目录规则，不能放宽证据门、匿名化、中文文档、前端 owner 边界和后端六边形边界。
- 本目录写入前必须确认两类硬门禁已经满足：前端 owner 只在入口、全局 Provider、路由表、route meta、runtime initializer、页面 shell、复杂模块、服务门面、TanStack cache、E2E mock 和 locale 指定层处理；后端 owner 只在 commands、application/usecase/service、core、platform、repository/adapter 和 contracts 指定层处理。
- 发生冲突时按“用户原始要求不可改写、raw/internal 证据优先于推测、同一主题最深层目录规则优先、更严格规则优先”的顺序处理。
- 本目录和下级目录禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。


## accounts route/module shell 边界

- 本目录只负责 accounts 路由参数、页面骨架、layout 装配和模块入口挂载。
- page.tsx 不得同时 owning store、query、event、dialog 和 content。
- 具体业务还原必须进入 `src/features/accounts` 的 Provider、hooks、cache、StoreUpdater、Content、components、dialogs、panels、types 和 tests 等模块 owner；本路由目录和 `page.tsx` 只消费 feature Provider、hooks、cache、StoreUpdater/Content，不拥有业务状态、查询或弹窗流程。
