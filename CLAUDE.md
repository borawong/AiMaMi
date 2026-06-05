# OpenAiMami Claude 执行规则

本文件是 Claude 在仓库根目录工作时必须读取的独立规则。不要把本文件简化为对 AGENTS.md 的引用；本文件自身包含完整原文。下级 CLAUDE.md 只能做渐进式覆盖：增加更具体、更严格的约束；不得摘要、改写、替换或放宽本文件中的原文要求。

## 工作顺序

1. 先保留架构决策原文和重构门禁原文。
2. 再调整目录结构，使前端和后端都能承载原文中的 owner 边界。
3. 再把原始前后端按照两份原文要求重构掉；现有代码也必须纳入重构，不能因为“不新增”而保留旧边界。
4. 再按目标要求做前端全量还原：前端文件、路由、模块、入口、运行时、服务门面、缓存、弹窗、面板、测试和文档必须逐步对齐 raw/internal 全链条材料。
5. 后端不做闭源业务全量还原，这是项目范围选择。后端必须按照逆向内容打出真实六边形架构全骨架。
6. 任何未由仓库内 raw/internal 证据支撑的业务实现，不得写成真实逻辑；只能写职责注释、边界、接口、DTO、错误语义、测试占位和待补证据位置。

## 原文一：架构决策

## 决策  前端采用以下 owner 边界：  - `entry/root` 只装配全局 Provider、Router、错误边界、runtime initializer 和 prompt host。 - route registry 是 route、layout、error boundary、title/icon、visibility、preload、skeleton 和高 IO feedback 的唯一 owner；sidebar、header、tray 和页面 title 只消费同一份 route meta。 - runtime initializer 是无 UI 副作用层，只负责事件订阅、bootstrap seed、cache 写入和模块 action 调度；不得拥有弹窗、toast 文案或业务列表状态。 - `<module>-page.tsx` 只能作为 route/module shell，负责路由参数、页面骨架、布局装配和模块 Provider。 - 复杂模块必须拆出 Provider / StoreUpdater / Content、hooks、cache、dialogs、panels、components、types 和贴近模块的 tests。 - TanStack cache 是后端事实唯一前端 SOT；组件 state 只保存选择、草稿、hover/focus、弹窗开关等短生命周期 UI 状态。 - full refresh、active-only refresh、runtime event reload、mutation payload、single-flight、stale/delayed response、abort 和 replay 防护由模块 query hook/cache helper owning。 - 后端返回权威 mutation payload 时，模块 helper 先写 TanStack cache，再按模块合同失效 query；旧 refetch、旧 snapshot、事件重放或 delayed response 晚返回时不得覆盖 mutation 结果。 - 用户可见文案必须进入 `src/locales/zh.json` 和 `src/locales/en.json`；测试断言也应通过 locale helper 或 locale JSON，不继续硬编码用户可见文案。 - E2E mock 必须能模拟 stale、delayed、failure、concurrency、cancel 和 event replay；happy path 不能作为状态架构验收。  后端采用以下 owner 边界：  - `src-tauri/src/commands/*` 只做 Tauri 参数反序列化、state/repository 获取、调用 usecase/core 和返回 envelope。 - application/usecase/service owning 一个用户动作的一次事务：校验输入、组织 repository/platform/core、提交结果。 - core owning domain model、解析、迁移、状态机、DTO 转换、错误语义和 single-flight；core 不依赖 Tauri UI 对象。 - platform 只封装 OS、进程、路径、权限、窗口、通知、shell/no-console、daemon/task/launchd 等能力。 - repository/adapter 集中文件系统读写和路径安全；真实 FS 与 fake/temp FS 必须可替换。 - IPC DTO、domain model 和前端 TypeScript 类型分开；改 DTO 必须同步 Rust DTO、TS types、API wrapper 和 E2E mock。 - 错误按 Domain / Repository / Platform / Runtime 分类后映射 CoreError，保留诊断 code 和脱敏语义。 - 阻塞文件 IO、native tray rebuild、daemon runner 和外部进程不得卡 IPC mutation response 返回。

## 原文二：重构门禁

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
