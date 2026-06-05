{
  "target": "aimami/1.0.9/windows/skills/load_installed_skills",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x14027b900",
  "owner": "0x1405783e0",
  "callees": [
    "repo lock/poisoned-lock",
    "recursive scan/sort summaries",
    "0x1405850F0 envelope/path helper"
  ],
  "interface": "none",
  "side_effect": "read-only: metadata root, recursive skills scan, SKILL.md summary parse, stable sort, bootstrap cache update on mac wrapper",
  "acceptance_mapping": "unit/manual: empty skills root returns empty list; nested directory with SKILL.md appears with summary/relativePath; dot directories ignored; poisoned lock returns error envelope",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}