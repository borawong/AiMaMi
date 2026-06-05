{
  "target": "aimami/1.0.9/windows/skills/remove_skill",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x14027cf80",
  "owner": "0x140576ae0",
  "callees": [
    "0x14024A780 remove helper",
    "load installed",
    "backup target",
    "remove_dir_all"
  ],
  "interface": "{ id: string }",
  "side_effect": "mutating FS: load installed list, match id, backup target with action remove, remove_dir_all target, reload installed count",
  "acceptance_mapping": "manual/unit: remove existing skill creates backup and decrements count; missing id returns not-found error; remove_dir_all failure preserves error envelope",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}