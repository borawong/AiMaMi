{
  "target": "aimami/1.0.9/macos/skills/import_skill",
  "status": "readyToImplement",
  "thread_model": "sync filesystem/repo mutex",
  "wrapper": "0x10015d9b4",
  "owner": "0x1001dbbdc",
  "callees": [
    "0x1001df318 backup_skill_directory",
    "0x1001db848 copy_dir_all",
    "0x1001dd6d8 load_skill_summary",
    "std::fs::DirBuilder::_create",
    "std::sys::fs::remove_dir_all",
    "canonicalize"
  ],
  "interface": "{ path: string }",
  "side_effect": "mutating FS: ensure skills and skill-backups dirs, validate directory or SKILL.md file, canonicalize, optional backup existing target, remove existing, recursive copy, reload summary",
  "acceptance_mapping": "manual/unit: import directory and single SKILL.md source; replace existing creates backup; invalid source errors; imported summary returned and installed query invalidated",
  "do_not_use": [
    "1.0.8 historical rows as proof",
    "non-IDA backend routes"
  ]
}