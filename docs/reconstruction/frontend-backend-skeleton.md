# 前端与后端骨架规则

本文件定义 OpenAiMami 1.0.9 的前端重建规则和后端六边形骨架规则。它描述允许的架构形态、证据等级和未来 PR 门槛；它本身不声称已经还原全部业务实现。

## 阶段目标

当前阶段的目标是建立完整、公开、可审计的骨架，让后续实现可以按证据补齐，而不需要再次重塑仓库结构。

- 前端采用主流前端模块化架构重构并还原。
- 前端文件、注释、文档和提交说明不得写入外部参考仓库名称。
- 前端行为必须基于 raw/internal 证据。
- 后端保持六边形架构骨架。
- 后端业务实现暂不还原是项目范围选择。

## 前端模块边界

前端目标边界包括：

- `app`
- `routes`
- `features`
- `services`
- `store`
- `hooks`
- `utils`
- `types`
- `config`
- `locales`
- `libs`
- `layout`

这些目录是重建边界，不是原始源码声明。跨模块导入应优先经过模块公开出口，特性私有实现应留在所属 feature 或 service 内。

## 前端覆盖面

OpenAiMami 1.0.9 前端骨架应覆盖已知页面和模块表面：

- `overview`
- `accounts`
- `sessions`
- `analytics`
- `custom-instructions`
- `mcp`
- `skills`
- `relay`
- `settings`
- `maintenance`
- `daemon-autoswitch`
- `tray-shell`
- `voice`

覆盖意味着公开路由、模块壳、类型边界、加载状态、空状态、错误状态和服务契约位置存在；不意味着原始源码已经被恢复。

## 前端还原顺序

1. route registry：先还原路由注册、页面标识和懒加载边界。
2. entry/root：再还原入口文件、根组件、全局 Provider 和挂载结构。
3. runtime initializer：还原运行期初始化顺序、启动状态和全局副作用入口。
4. 深模块：逐步补齐 Provider、StoreUpdater、Content、cache、hooks、dialogs、panels、components、types、tests。
5. IPC 和数据：用 raw/internal 证据补齐 IPC 包装、DTO、缓存键、错误态和交互状态。

## 证据等级

| 等级 | 可用于 | 不可用于 |
| --- | --- | --- |
| `P0` | bundle manifest 事实、文件名、chunk 名、页面存在性、模块存在性。 | 业务行为或源码级实现声明。 |
| `P1` | IPC、DTO、命令边界、包装名、参数键、页面与模块边界。 | 未观察到的副作用或推断出的后端业务逻辑。 |
| `P2` | 源码骨架、路由壳、加载态、错误态、空态、类型占位和模块门面。 | 声称 dumped 或压缩分析等同于原始源码。 |

任何补齐前端真实行为的 PR 都必须标明证据等级，并列出对应 raw/internal 路径。

## 后端架构边界

后端目标是六边形架构骨架，核心边界为：

- `commands`
- `application`
- `core`
- `platform`
- `repository`
- `adapters`
- `contracts`

命令层只做输入解析、契约转换和薄适配。业务编排进入 application，稳定领域类型进入 core，平台与存储边界进入 platform 和 repository，外部适配进入 adapters，可序列化前后端契约进入 contracts。

## 后端还原规则

- 不把未证实业务写成实现。
- 不把暂不还原解释成材料缺口。
- 新行为必须先定义 contracts 和端口边界，再补 application 和 adapters。
- commands 不应成为业务逻辑容器。
- 桩实现必须明确标注待实现项和证据缺口。
- 未来补齐业务时必须说明 raw/internal 证据来源，以及是否核对 `OpenAiMami IDB`。

## 未来 PR 门槛

- 前端真实实现必须引用 route、module、IPC、DTO 或 command 边界证据。
- 前端骨架工作必须说明使用 `P0`、`P1` 或 `P2`。
- 后端业务实现必须通过 application、ports、repository、adapters 和 contracts 进入。
- 新文档必须使用中文和仓库相对路径。
- 所有材料必须通过匿名化检查。
