# AGENTS.md — raw/aimami/1.0.9/windows/relay-core

本级 = raw evidence tier relay-core 簇。IDA MCP pseudocode (.c) 和 manifest 文件。禁止其他逆向路线产物。

## PREWRITE_PRODUCER_COLLISION_GATE_V1

本层继承上层规则。写入前必须过 prewrite-owner-gate.py；decision=ALLOW 才可写。
