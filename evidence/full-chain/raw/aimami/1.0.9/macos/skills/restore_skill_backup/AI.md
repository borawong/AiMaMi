{
  "target": "aimami/1.0.9/macos/skills/restore_skill_backup",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x10015e858",
  "owner": "0x1001de3f0",
  "callees": [
    "std::fs::read_to_string metadata.json",
    "serde_json::from_trait",
    "0x1001df318 backup_skill_directory",
    "0x1001db848 copy_dir_all",
    "0x1001dd6d8 load_skill_summary"
  ],
  "interface": "{ id: string }",
  "side_effect": "mutating FS: join skill-backups/id, read metadata.json, backup existing installed target as rollbackBackup, remove target, copy backup tree, load restored summary",
  "acceptance_mapping": "manual/unit: restore existing backup returns restoredSkill and optional rollbackBackup; missing/corrupt metadata errors; copy failure reports error",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}