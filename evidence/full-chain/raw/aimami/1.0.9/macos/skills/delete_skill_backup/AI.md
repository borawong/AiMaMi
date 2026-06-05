{
  "target": "aimami/1.0.9/macos/skills/delete_skill_backup",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x1003269a4 registration/string cluster",
  "owner": "0x1001de3f0/backup path helpers",
  "callees": [
    "skill-backups/id path and metadata/delete semantics cross-closed with Windows direct helper 0x14024CDD0; mac string cluster and serializer fields confirm delete_skill_backup envelope"
  ],
  "interface": "{ id: string }",
  "side_effect": "mutating FS: join skill-backups/id, metadata/not-found check, remove backup dir/file, reload backup count",
  "acceptance_mapping": "manual/unit: delete existing backup decrements count; missing id returns not-found/error; remove failure surfaces error",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}