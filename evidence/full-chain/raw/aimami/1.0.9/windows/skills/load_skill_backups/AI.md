{
  "target": "aimami/1.0.9/windows/skills/load_skill_backups",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x14026c270",
  "owner": "0x1405770d0",
  "callees": [
    "0x14024AED0 load backups helper",
    "skill-backups/metadata.json scan",
    "repo lock/poisoned-lock"
  ],
  "interface": "none",
  "side_effect": "read-only: scan skill-backups, read metadata.json, build backup list, sort/list count",
  "acceptance_mapping": "unit/manual: absent backup root returns empty; valid metadata row appears; corrupt/missing metadata is error/not included per IDA branch",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}