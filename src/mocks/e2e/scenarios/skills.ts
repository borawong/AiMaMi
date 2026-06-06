import type { IpcCommandName } from "@/contracts/ipc";

export const SKILLS_E2E_COMMANDS = [
  "load_installed_skills",
  "load_skill_backups",
  "import_skill",
  "remove_skill",
  "restore_skill_backup",
  "delete_skill_backup",
] as const satisfies readonly IpcCommandName[];
