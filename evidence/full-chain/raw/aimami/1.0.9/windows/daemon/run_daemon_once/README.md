# AiMaMi 1.0.9 Windows — run_daemon_once

同步时间: 2026-06-02T10:59:43+08:00
范围: Windows x64 daemon module — run_daemon_once backend only
最终结论: strictImplementationUse — owner + core + call-tree + DTO + daemon trigger 全部闭合，dim6 (test/acceptance) per task spec 为空

## 证据索引
- ida/pseudocode/0001: run_daemon_once_owner_sys (0x1402843E0)
- ida/pseudocode/0002: run_daemon_once_core_resolve (0x1400723D0)
- ida/pseudocode/0003: run_daemon_once_core_impl (0x1400A3A40)
- call-trees/run_daemon_once.jsonl: depth 5
- validation/result.json

## Daemon 触发机制（Windows）
`schtasks /Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch /TR <exe_path> /F`
由 daemon_schtasks_register (0x1403FB450) 通过 CreateProcessW 执行。
调用链: run_daemon_once_core_impl -> sub_14056B7F0 -> daemon_schtasks_register

## BootstrapState DTO
argKeys: []
response: {schemaVersion, success, code, message, data{executedAt, runOnce, autoSwitchEnabled, activeAccountKey, switchedAccountKey, pendingSwitchAccountKey}}

## 缺口
- frontend_ccf: 本次未逆
- 4个 watcher 命令 (start_usage_refresh_watcher 等): Windows 1.0.9 二进制中不存在，macOS-only 或已移除

## Gate Leaf
strictImplementationUse — dim1-5 Accepted，dim6 empty
