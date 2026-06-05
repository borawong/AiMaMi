{
  "target": "aimami/1.0.9/macos/skills/load_installed_skills",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x10015ebe8",
  "owner": "0x1001deed0",
  "callees": [
    "0x1001defcc scan_skills_recursive",
    "0x1001dd6d8 load_skill_summary",
    "std::fs::metadata",
    "sort"
  ],
  "interface": "none",
  "side_effect": "read-only: metadata root, recursive skills scan, SKILL.md summary parse, stable sort, bootstrap cache update on mac wrapper",
  "acceptance_mapping": "unit/manual: empty skills root returns empty list; nested directory with SKILL.md appears with summary/relativePath; dot directories ignored; poisoned lock returns error envelope",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}