{
  "target": "aimami/1.0.9/windows/skills/restore_skill_backup",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x140276b60",
  "owner": "0x140577de0",
  "callees": [
    "0x14024D100 restore helper",
    "metadata.json parse",
    "backup existing",
    "copy backup",
    "load summary"
  ],
  "interface": "{ id: string }",
  "side_effect": "mutating FS: join skill-backups/id, read metadata.json, backup existing installed target as rollbackBackup, remove target, copy backup tree, load restored summary",
  "acceptance_mapping": "manual/unit: restore existing backup returns restoredSkill and optional rollbackBackup; missing/corrupt metadata errors; copy failure reports error",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}