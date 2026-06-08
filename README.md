# OpenAiMami

OpenAiMami 是一个面向个人本地工作流的桌面应用。本仓库公开项目的可审计材料，是为了支持个人持续迭代，也让使用者能够检查实现链路，判断它如何处理本地数据，从而降低隐私泄露和不透明执行的风险。

项目使用 [Apache License](LICENSE) 许可。任何改进、补全、审查和重建工作都应保留该许可上下文。

## 为什么公开

过去一部分 OpenAiMami 资料没有放在公开源码树中，外部使用者只能看到有限实现，难以确认界面、命令、数据读取、缓存和本地集成之间的完整关系。

现在公开这些材料的目的不是发布一次性快照，而是把闭源部分转为可检查、可复核、可继续演进的公开链条：

- 方便个人继续迭代 OpenAiMami。
- 让使用者在运行前能检查实现链路和重建依据。
- 用公开的 raw、internal、前端 dumped 文件和架构骨架减少对不透明本地包的依赖。
- 让隐私相关行为可以被审查，避免把用户数据、机器状态或内部路径写入公开材料。
- 接受基于仓库内 raw/internal 主链路，并在需要时核对 `OpenAiMami IDB` 的 PR。

## 仓库内容

本仓库保存可公开、匿名化、可审计的重建材料：

| 路径或材料 | 说明 |
| --- | --- |
| `README.md`、`README-cn.md` | 中文公开说明和 AI 重建提示模板。 |
| `docs/reconstruction/` | 重建规则、证据入口、发布规则、架构说明和大文件策略。 |
| `evidence/full-chain/raw/` | 匿名化 raw 链条，包含前端 dumped 文件、IPC、CCF、manifest、校验摘要和命令索引。 |
| `evidence/full-chain/internal/` | 匿名化 internal 链条，包含 audit map、frontend map、distilled logic、raw leaf 和索引。 |
| `evidence/binary-manifests/` | 外部大文件的大小、状态和哈希清单。 |
| `src/` | 当前公开前端源码和主流前端模块化重构入口。 |
| `src-tauri/` | 当前公开 Tauri 与 Rust 后端六边形骨架，以及已补回的原始公开后端能力。 |
| `LICENSE` | Apache License 许可文本。 |

LFS/IDB 资料独立称为 `OpenAiMami IDB`。主仓库不直接保存大体积 IDB 文件，只保存匿名化 raw/internal、前端 dumped 文件、架构骨架、重建文档和独立资产清单。还原应以 `evidence/full-chain/internal` 和 `evidence/full-chain/raw` 为主线，IDB 只作为可选的独立参考资产，不能写成“只靠 IDB”。

## 重建流程

1. 先确认 `evidence/full-chain/raw` 与 `evidence/full-chain/internal` 的索引、manifest、校验摘要和前端 dumped 校验文件一致。
2. 从 raw 链条读取 macOS/Windows 前端 dumped 文件、IPC、CCF、manifest 和命令级证据。
3. 从 internal 链条读取 audit map、frontend map、distilled logic、raw leaf 和版本差异材料。
4. 前端按 route registry、entry/root、runtime initializer，以及深模块 Provider、StoreUpdater、Content、cache、hooks、dialogs、panels、components、types、tests 逐步还原。
5. 前端实现应采用主流前端模块化架构重构并还原，不写入任何外部参考仓库名称。
6. 后端明确保持六边形架构骨架，按 commands、application、core、platform、repository、adapters、contracts 边界渐进补齐；原始公开后端已经公开过的能力应补回骨架内。
7. 未公开或未选择还原的后端业务行为只能保留为契约、桩或待实现项，不能写成真实闭源业务实现。
8. 所有新增注释和文档使用中文，所有路径使用仓库相对路径。

## 当前补回状态

### 已做

- 保留 Apache License 许可上下文、中文公开说明、raw/internal 主链路、前端 dumped 证据和匿名化规则。
- 前端按当前公开证据恢复到主流模块化骨架，保留 route registry、entry/root、runtime initializer、深模块 Provider/StoreUpdater/Content、cache、hooks、dialogs、panels、components、types 和测试边界。
- 后端不再只是空六边形目录；已把原始公开后端中可公开的 MCP、Skills、自定义指令、系统设置、系统信息、打开路径、热点开关状态、插件合同空列表和 Tauri command 注册补入当前六边形骨架。
- 已把后端公开能力拆到 `commands`、`application/usecase`、`repository`、`repository/adapter`、`platform`、`contracts` 和 `core/error` 边界：command 只接参数和状态，usecase 负责编排，repository/adapter 负责文件读写，platform 负责系统能力，contracts 负责前后端可序列化数据形状。
- `scripts/validate-backend-hexagonal.mjs` 已从“全仓禁止真实副作用”改成“按 owner 限制副作用”：文件系统只允许仓储/适配器边界，进程、窗口、shell 只允许平台边界，voice 仍保持空骨架门禁。
- 新增 `scripts/validate-frontend-leaf-copy-acceptance.mjs`，把前端 leaf 和全文案验收从静态覆盖扫描中分离出来；当前该严格 gate 应当失败，直到 internal gate 和逐条文案来源验收全部完成。
- `README.md` 与 `README-cn.md` 保持中文同步，记录当前已经做了什么、没有做什么，方便 PR 继续补齐。

### 未做

- 前端 macOS / Windows 双平台 100% leaf 尚未完成验收；现有 `validate-frontend-dumped`、`validate-frontend-evidence` 和 `validate-i18n` 只能证明静态覆盖、owner 边界和 locale key 同步，不能证明所有 leaf、渲染、交互和文案语义已逐条还原。
- 全文案逐条验收尚未完成；当前没有 `evidence/full-chain/internal/frontend-copy-acceptance.json` 记录每个 locale key 对应的 raw/internal 中文来源、英文来源和验收状态。
- 后端闭源业务不做全量还原；没有公开证据支撑的业务行为仍只能保留为合同、桩、待实现项或测试缺口。
- voice 前后端不做真实功能还原，只保留空骨架和说明；原始公开材料中与录音、语音运行时、快捷键、音频反馈、文本注入相关的内容不进入当前公开实现。
- Accounts、Relay、Analytics、Sessions、Daemon 自动切换、更新安装、外部进程重启/强杀等后端能力仍未完成真实业务闭环；其中部分前端 wrapper 和后端命令只返回明确的未恢复状态。
- MCP 写回当前使用结构化 TOML 保存，已在源码层面对接命令和数据，但还没有恢复原始实现中对注释和托管块位置的完整保留策略。
- Rust 编译验收需要具备目标平台工具链；Windows 下缺少 MSVC `link.exe` 时，`cargo check` 会在第三方 crate build script 阶段失败。

## 可直接给 AI 的重建提示

```text
请只使用当前公开仓库，按可审计方式重建 OpenAiMami 1.0.9。所有新增注释和文档必须使用中文，不写入内部路径、机器名、用户名、共享盘、内部项目名、凭据或任何未匿名化材料。

第一步先校验证据完整性：
1. 先读取 `evidence/full-chain/raw/INDEX.md`、`evidence/full-chain/raw/command-index.json`、`evidence/full-chain/raw/validation-summary.json`。
2. 通过 raw 索引定位前端 dumped 校验文件，并校验其中列出的前端 dumped 文件。
3. 校验相关 manifest hash，确认 raw 链条和清单一致。
4. 任何 raw 子路径都必须按仓库索引解析，不能写入本机路径、机器名或未匿名来源。

第二步读取 raw 链条：
1. 从 `evidence/full-chain/raw` 读取 macOS/Windows 前端 dumped 文件。
2. 读取 IPC、CCF、manifest、命令索引、校验摘要和前端 dumped 校验材料。
3. 只使用仓库相对路径，不依赖本机状态、隐藏目录、个人数据或未公开文件。

第三步读取 internal 链条：
1. 从 `evidence/full-chain/internal` 读取 audit map。
2. 读取 frontend map。
3. 读取 distilled logic。
4. 读取 raw leaf。
5. 用 internal 链条解释结构、边界、页面和数据流，用 raw 链条校验来源。

第四步还原前端：
1. 按 route registry 还原路由表和页面入口。
2. 按 entry/root 还原应用入口、根组件和全局挂载。
3. 按 runtime initializer 还原运行期初始化顺序。
4. 按深模块边界逐步补齐 Provider、StoreUpdater、Content、cache、hooks、dialogs、panels、components、types、tests。
5. 前端采用主流前端模块化架构重构并还原，但不得写入外部参考仓库名称。
6. 每个页面、IPC 包装、数据类型、缓存和交互状态都必须能回指到 raw/internal 证据。

第五步还原后端：
1. 后端按 commands、application、core、platform、repository、adapters、contracts 六边形骨架渐进补齐。
2. commands 只作为薄适配层，不承载业务逻辑。
3. application 负责用例编排，core 保留稳定领域类型，platform 和 repository 保留平台与存储边界，adapters 负责外部适配，contracts 负责前后端可序列化契约。
4. 原始公开后端已经公开过的能力应补回骨架内，并保持 command、usecase、repository、platform、contracts 的 owner 边界。
5. 不把未公开或未选择还原的后端业务写成实现；这些行为必须写成契约、桩、待实现项或测试缺口。
6. 不还原闭源后端业务实现是项目范围选择，不要描述成材料缺口。

第六步提交要求：
1. 保留 Apache License 许可上下文。
2. 不写入内部路径、机器名、用户名、共享盘、内部项目名或凭据。
3. 不写入外部参考仓库名称。
4. 新增文档和注释使用中文。
5. 如果基于 raw/internal 主链路还原出完整实现，并按需要核对 `OpenAiMami IDB`，请以 PR 形式提交，并在说明中列出证据路径、校验结果和未覆盖项。
```

## PR 规则

欢迎提交以下类型的 PR：

- 基于 `evidence/full-chain/raw` 和 `evidence/full-chain/internal` 补齐完整实现。
- 补齐前端路由、模块、状态、IPC 包装、缓存、对话框、面板、组件、类型和测试。
- 按六边形架构补齐后端端口、用例、适配器和契约。
- 改进隐私审查、匿名化规则、校验脚本或重建文档。
- 修正文档中的证据路径、哈希、manifest 或流程错误。

PR 必须说明：

- 使用了哪些 raw/internal 证据，以及是否核对 `OpenAiMami IDB`。
- 做了哪些校验。
- 哪些行为已还原，哪些仍是桩或待实现项。
- 是否修改了用户数据读写、缓存、导入导出、清理、恢复或本地集成逻辑。

## 匿名化规则

公开文档和提交说明不得包含：

- 内部项目名。
- 本机用户名、机器名、共享盘路径或绝对本地路径。
- 凭据、令牌、会话、密钥、账号私密值或未脱敏日志。
- 个人数据、客户数据、运行期缓存或未审查 dump。
- 外部参考仓库名称。

请只使用仓库相对路径描述证据和实现。发现未脱敏材料时，应先改成占位说明，再提交 PR。
