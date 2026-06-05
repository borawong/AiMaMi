# AGENTS.md

Raw 证据 <TIER>。规则见上层 AGENTS 8 条 ruleset。Raw 按 platform/process 组织，无日期/机器后缀。结论在 internal。

## PREWRITE_PRODUCER_COLLISION_GATE_V1

本层继承上层 `PREWRITE_PRODUCER_COLLISION_GATE_V1`。写入前必须重读本层 `AGENTS.md` + `CLAUDE.md` 与上层完整规则；缺任一项即禁止写。`README.md`/`AI.md` 不是协作双入口，不能替代 `AGENTS.md`/`CLAUDE.md`。
