# 公开源码地图

本文件描述当前公开仓库结构，以及它在 OpenAiMami 1.0.9 重建中的角色。所有路径均为仓库相对路径。

## 项目元信息

| 项目 | 值 |
| --- | --- |
| 包名 | 以 `package.json` 为准 |
| 仓库内公开版本 | `1.0.0` |
| 目标重建版本 | `1.0.9` |
| 许可 | Apache License |
| 桌面应用名称 | OpenAiMami |
| 技术栈 | Tauri 2、React、Rust |
| 前端构建 | Vite、TypeScript |

## 顶层结构

| 路径 | 角色 |
| --- | --- |
| `src/` | 当前公开前端源码和重构入口。 |
| `src-tauri/` | 当前公开 Tauri 与 Rust 后端骨架。 |
| `docs/reconstruction/` | 中文重建说明。 |
| `evidence/full-chain/raw/` | raw 链条、前端 dumped 文件、IPC、CCF、manifest 和校验摘要。 |
| `evidence/full-chain/internal/` | 审计地图、前端地图、蒸馏逻辑、原始叶子和结构化摘要。 |
| `evidence/binary-manifests/1.0.9/i64-databases.json` | `OpenAiMami IDB` 状态、大小和哈希清单。 |
| `package.json` | 前端脚本和依赖声明。 |
| `src-tauri/Cargo.toml` | Rust 包和依赖声明。 |
| `src-tauri/tauri.conf.json` | Tauri 应用和打包配置。 |

## 前端目标边界

前端按主流模块化架构重构并还原，目标边界包括：

| 边界 | 角色 |
| --- | --- |
| `app` | 应用启动、Provider 和根组合。 |
| `routes` | 懒加载路由、页面壳、加载态、错误态和空态。 |
| `features` | 功能公开接口和私有实现。 |
| `services` | IPC 包装、运行期适配和服务契约。 |
| `store` | 类型化状态骨架、选择器和 StoreUpdater。 |
| `hooks` | 共享 React 钩子。 |
| `utils` | 共享工具函数。 |
| `types` | 共享 TypeScript 类型。 |
| `config` | 公开配置常量和默认值。 |
| `locales` | 本地化资源。 |
| `libs` | 第三方库包装和稳定门面。 |
| `layout` | 应用外壳、导航、托盘相关外壳和公共布局。 |

OpenAiMami 1.0.9 前端覆盖面：

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

## 当前前端入口

| 路径 | 说明 |
| --- | --- |
| `src/main.tsx` | React 启动入口。 |
| `src/App.tsx` | 应用根包装。 |
| `src/main-app.tsx` | 主路由状态、页面加载和外壳组合。 |
| `src/components/layout/` | 侧栏和布局组件。 |
| `src/features/custom-instructions/components/` | 自定义指令工作流界面。 |
| `src/features/mcp/components/` | MCP 管理界面。 |
| `src/features/skills/components/` | Skills 管理界面。 |
| `src/features/maintenance/components/` | 维护操作界面。 |
| `src/features/plugins/components/` | 插件管理界面。 |
| `src/features/settings/components/` | 设置界面。 |
| `src/components/update/` | 更新覆盖层。 |
| `src/components/runtime/` | 运行期对话框。 |
| `src/components/ui/` | 共享 primitive 基础组件；不得放业务组合组件或模块私有状态。 |
| `src/hooks/` | React 钩子。 |
| `src/locales/` | 本地化资源。 |
| `src/types/` | 共享 TypeScript 类型。 |

## 后端目标边界

后端是六边形架构骨架：

| 边界 | 角色 |
| --- | --- |
| `commands` | Tauri 命令薄适配层。 |
| `application` | 用例编排和服务组合。 |
| `core` | 稳定领域类型和错误。 |
| `platform` | 平台能力边界。 |
| `repository` | 存储边界。 |
| `adapters` | 外部适配和桩实现。 |
| `contracts` | 前后端可序列化 DTO 和默认响应。 |

不还原后端业务实现是项目范围选择。未来业务补齐必须通过 contracts、application、repository、platform 和 adapters 进入，commands 不能变成业务逻辑容器。

## Tauri 命令表面

命令注册点是 `src-tauri/src/lib.rs`。公开命令模块位于 `src-tauri/src/commands/`。

| 模块 | 命令 |
| --- | --- |
| `custom_instructions.rs` | `load_custom_instruction_state`、`preview_custom_instruction_apply`、`apply_custom_instruction`、`clear_custom_instruction_block`、`rollback_custom_instruction` |
| `hotspot.rs` | `has_notch`、`get_hotspot_enabled`、`set_hotspot_enabled`、`focus_main_window`、`hotspot_ready` |
| `mcp.rs` | `load_mcp_servers`、`upsert_mcp_server`、`set_mcp_server_enabled`、`remove_mcp_server` |
| `skills.rs` | `load_installed_skills`、`load_skill_backups`、`import_skill`、`remove_skill`、`restore_skill_backup`、`delete_skill_backup` |
| `system.rs` | `clean`、`rebuild_registry`、`set_auto_switch`、`configure_auto_switch`、`set_api_proxy_config`、`get_usage_refresh_interval`、`set_usage_refresh_interval`、`test_api_proxy_config`、`detect_api_proxy_config`、`run_daemon_once`、`diagnose`、`restart_codex`、`load_bootstrap_state`、`get_system_info`、`graceful_restart_for_update`、`check_update_installability`、`open_path` |

只有通过 `tauri::generate_handler!` 注册的命令属于前端 IPC 表面。模块内辅助函数不应被当成 IPC 入口，除非它被注册。

## 构建和打包

| 路径 | 说明 |
| --- | --- |
| `package.json` | 定义 `dev`、`dev:web`、`build`、`preview`、`tauri` 等脚本。 |
| `src-tauri/tauri.conf.json` | 使用 Tauri 打包配置和 `../dist` 前端输出。 |
| `src-tauri/Cargo.toml` | 定义 Rust 包元信息、Apache License、Tauri 2 依赖和平台依赖。 |

## 资产

`assets/` 中保存公开应用资产。`OpenAiMami IDB` 是独立参考资产，主仓库只保存它的 manifest、大小和哈希信息。需要还原完整实现时，应先使用 raw/internal，再按需要核对 IDB 清单。
