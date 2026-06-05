{
  "target": "aimami/1.0.9/windows/skills/delete_skill_backup",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x140271280",
  "owner": "0x140577810",
  "callees": [
    "0x14024CDD0 delete helper",
    "join skill-backups/id",
    "metadata/not-found branch",
    "remove path",
    "reload backup list"
  ],
  "interface": "{ id: string }",
  "side_effect": "mutating FS: join skill-backups/id, metadata/not-found check, remove backup dir/file, reload backup count",
  "acceptance_mapping": "manual/unit: delete existing backup decrements count; missing id returns not-found/error; remove failure surfaces error",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}