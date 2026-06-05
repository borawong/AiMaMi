{
  "target": "aimami/1.0.9/macos/skills/load_skill_backups",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x1003269a4 registration/string cluster",
  "owner": "0x1001df318/0x1001de3f0 backup metadata helpers",
  "callees": [
    "skill-backups metadata scan/read path confirmed by 0x100ee0bd5/0x100ee11f7 xrefs",
    "serde SkillBackupSummary/Metadata serializers"
  ],
  "interface": "none",
  "side_effect": "read-only: scan skill-backups, read metadata.json, build backup list, sort/list count",
  "acceptance_mapping": "unit/manual: absent backup root returns empty; valid metadata row appears; corrupt/missing metadata is error/not included per IDA branch",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}