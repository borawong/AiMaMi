{
  "target": "aimami/1.0.9/windows/skills/import_skill",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x1402772d0",
  "owner": "0x1405764e0",
  "callees": [
    "0x140249230 import helper",
    "validate SKILL.md",
    "backup replace",
    "recursive copy/remove existing"
  ],
  "interface": "{ path: string }",
  "side_effect": "mutating FS: ensure skills and skill-backups dirs, validate directory or SKILL.md file, canonicalize, optional backup existing target, remove existing, recursive copy, reload summary",
  "acceptance_mapping": "manual/unit: import directory and single SKILL.md source; replace existing creates backup; invalid source errors; imported summary returned and installed query invalidated",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}