# 重构门禁原文

本文件只封存重构门禁原文。后续任何目录结构、前端还原、后端六边形骨架、文档分层和审查验收，都必须先逐条满足本文件原文，不得摘要、改写或用其他描述替代。

后端架构重构必须先满足以下规则，再移动代码或调整目录：

| 领域                  | 最终规则                                                     |
| --------------------- | ------------------------------------------------------------ |
| 前端入口              | 应用入口只初始化全局 Provider、Router、错误边界和全局监听，不承载业务流程、文件状态、IPC 编排或模块私有状态。Provider 顺序、QueryClient 实例和全局 error boundary 必须稳定，不能在页面切换时重建；桌面 basename、启动错误和调试入口只在入口层处理。 |
| 全局 Provider         | 全局 Provider 统一聚合 Locale、Theme、Query、auth/bootstrap seed、toast/modal/context host、runtime bridge 和开发辅助；Provider 只建立上下文，不读取模块私有数据、不渲染业务页面、不在模块切换时重建 QueryClient。 |
| 路由表                | route、layout、error boundary、meta、visibility、redirect、预加载和 fill-height 等页面导航属性集中在路由表 / navigation registry；主组件不得用大型 switch 同时承载路由、业务状态和模块副作用。页面和 layout 通过统一 lazy wrapper 管理 loading 与 chunk error。 |
| route meta            | 导航 title、icon、visible gate、动态标题、route preload 和 skeleton 类型归路由 meta 或 navigation registry；sidebar/header/tray 只消费 meta，不重复维护路由 union、文案 key 或可见性规则。 |
| runtime initializer   | 运行时初始化、事件订阅、bootstrap seed、daemon/event reload 和一次性同步必须拆成 null-render initializer / hook；initializer 只写 query/cache 或调度 action，不渲染业务 UI、不拥有弹窗文案。事件 payload 到 query key/cache helper 的映射必须集中声明并集中清理监听。 |
| 页面 / 路由           | 页面文件只负责路由参数、页面骨架、布局装配和模块入口挂载；业务流程、数据请求、弹窗状态机和列表操作不得堆在页面入口。URL 参数同步到模块状态必须放 hydration / updater 组件，不放展示组件。 |
| 业务组件              | `src/components/<模块>/` 只放该模块的渲染、交互和局部 view model；复杂模块继续拆 `provider.tsx`、`hooks/`、`cache/`、`dialogs/`、`panels/`、`components/`、`types.ts`、`tests/` 等深层 owner。深模块必须只有一个 owner，不得另起第二套 UI primitive 或跨模块隐式共享业务状态。 |
| 复杂模块状态          | 复杂模块按 Provider / StoreUpdater / Content 或等价结构拆分：Provider 建立模块上下文，StoreUpdater 只同步外部 props / event / query cache 到模块状态，Content 只渲染和发出用户意图。不得让页面文件同时 owning store、query、event、dialog 和 content。 |
| 服务层                | 前端 service/API 门面唯一入口是 `src/lib/api.ts` 和模块服务 wrapper。页面、组件、hook 不直接拼 IPC transport、桌面插件或事件名；desktop bridge、路径打开、更新器、托盘和系统能力先收敛为窄适配。 |
| 共享组件              | `src/components/ui/` 只放 shadcn/Radix primitive；跨模块但非 primitive 的组合组件必须有清楚职责，不得夹带模块私有状态机。 |
| IPC / API             | 前端访问后端能力必须经 `src/lib/api.ts` 收口；组件、页面、hooks 和测试辅助不得直接拼底层 transport 或绕过 API wrapper。改 command、DTO、error envelope 时必须同步 Rust DTO/command、TypeScript 类型、API wrapper 和 E2E mock。 |
| TanStack 状态         | 后端事实只能由模块 query hook / cache helper owning。组件 state 只保存短生命周期 UI 状态；账号列表、runtime snapshot、配额历史、relay state、MCP/skills/custom-instructions 等服务端事实不得长期存在组件私有 state。 |
| mutation / invalidate | 后端返回权威 mutation payload 时，模块 helper 先写 TanStack cache，再按模块合同失效 query；旧 refetch、旧 snapshot、事件重放或 delayed response 晚返回时，不得覆盖更新后的 mutation 结果。 |
| 异步去重              | 同一模块的全量刷新、active-only 刷新、runtime reload、用量刷新、daemon/event 触发刷新必须按 query key 或 operation key single-flight/coalesce。按钮 disabled 只能作为 UI 反馈，不能替代架构级去重。 |
| 事件重载              | runtime event listener 必须集中注册和清理，并声明 event payload 到 query key/cache helper 的映射。事件重放、乱序和晚返回必须服从 mutation response 与最新 query sequence，不得直接写组件 state。 |
| i18n                  | 所有用户可见文案归属到模块 locale key，zh/en 同步。组件、hooks、API 和测试断言不得硬编码中文/英文 UI 字符串；修改文案应改原所属 key，不新建临时 key 或跨模块借 key。 |
| E2E mock              | E2E mock 是 IPC / DTO / 状态竞争合同镜像。涉及 query/cache、事件重载、刷新、mutation、toast、弹窗 busy 或失败态的变更，mock 必须能模拟正常、异常、空状态、delayed response、stale response、并发重复提交、取消/关闭、abort 和事件重放。 |
| Rust command          | `src-tauri/src/commands/*` 只做 IPC adapter：参数反序列化、获取/克隆 app state、调度 blocking task、调用 application/core、封装 `CoreEnvelope<T>`、必要时在 core 返回后触发 UI runtime 副作用。命令层不写业务规则、文件 IO 事务、HTTP、平台 API 或 UI 文案。 |
| Rust usecase          | 用户动作级事务必须有 usecase / service owner：校验输入、读取 repository、调用 domain service/platform adapter、执行原子写入或后台调度、返回 DTO。导入/删除账号、relay 启停、初始化助手、daemon runner、项目配置写入等跨文件动作不能继续膨胀在 command 或单个过载 core 文件里。 |
| Rust core             | `src-tauri/src/core/*` 承载业务规则、领域模型、解析/迁移、文件 IO、出站 HTTP、DTO 转换、错误语义、single-flight 和后台调度边界。跨模块事务必须以 usecase / service / repository 方法表达，命名描述业务动作而不是 UI 按钮。阻塞 IO、tray rebuild、daemon runner 和外部进程操作必须有明确返回路径，不能卡住 IPC mutation response。 |
| Rust adapter          | 文件系统、HTTP、数据库、进程、计划任务、窗口、通知、shell 和平台权限必须通过窄 adapter / trait 或窄函数进入 core；测试用 fake/temp 实现验证契约，不碰真实用户环境。 |
| Rust platform         | `src-tauri/src/platform/*` 只封装 OS 能力并返回结构化能力结果；不保存账号、relay、MCP、skills 等业务状态，不解释产品状态机，不把单平台行为写成通用事实。 |
| Repository            | `Repository` 只持有可重建的路径和共享上下文，不保存跨命令业务状态。每个命令应能从文件状态重建结果；需要缓存时必须有明确文件源、失效规则和测试。 |
| 接口 / 适配器注释     | 深模块、接口、适配器和跨层 usecase 必须有简短中文注释说明职责和边界；普通自解释实现不写空泛注释。 |
