# Frontend Full Chain - AiMaMi 1.0.9 Windows skills

Scope: additive frontend/current-source archive consumer chain for the accepted Windows skills closure. This file does not change gate state.

## UI entry

- Route/page: `src/components/skills/skills-page.tsx`.

## API and invoke chain

- `api.loadInstalledSkills()` -> `invoke("load_installed_skills")`.
- `api.loadSkillBackups()` -> `invoke("load_skill_backups")`.
- `api.importSkill(...)` -> `invoke("import_skill")`.
- `api.removeSkill(...)` -> `invoke("remove_skill")`.
- `api.restoreSkillBackup(...)` -> `invoke("restore_skill_backup")`.
- `api.deleteSkillBackup(...)` -> `invoke("delete_skill_backup")`.

Backend binding is `src-tauri/src/commands/skills.rs` into `src-tauri/src/core/skills.rs`.

## Shell load and state effects

- `load_bootstrap_state` includes the `installedSkills` bootstrap cache slice.
- `src/main-app.tsx` seeds `["installed-skills"]` from bootstrap data.
- Skills page loads installed skills on route mount and backups on the backups tab.
- Mutations invalidate `["installed-skills"]` and/or `["skill-backups"]`.

